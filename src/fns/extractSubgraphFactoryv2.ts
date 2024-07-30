import dedent from "dedent";
import { neo4jAction, neo4jDriver } from "../clients/neo4j";
import { AnyNodeDefinitionMap, GenericNodeShape, NodeDefinitionMap, NodeShape } from "../definitions/NodeDefinition";
import { AnySubgraphDefinition, GenericSubgraphDefinition, SubgraphDefinition } from "../definitions/SubgraphDefinition";
import { Ok } from "../types/Result";
import { SubgraphPathDefinition } from "../definitions/SubgraphPathDefinition";
import { AnyRelationshipDefinition, GenericRelationshipShape, RelationshipState } from "../definitions/RelationshipDefinition";
import { writeFileSync } from "fs";
import { EagerResult, Integer, Node, Path, Relationship } from "neo4j-driver";






export const extractSubgraphFactoryv2 = <
    NodeDefinitionMap extends AnyNodeDefinitionMap,
>(
    nodeDefinitionMap: NodeDefinitionMap
) => neo4jAction(async <
    RootNodeType extends keyof NodeDefinitionMap,
    SubgraphIndex extends ({
        [UniqueIndex in NodeDefinitionMap[RootNodeType]['uniqueIndexes'][number]]?: string
    }),
    SubgraphDefinitionRef extends AnySubgraphDefinition
>(
    rootNode: (({
        nodeType: RootNodeType
    }) & SubgraphIndex),
    defineSubgraph: (subgraph: SubgraphDefinition<
        NodeDefinitionMap, 
        [SubgraphPathDefinition<
            NodeDefinitionMap,
            RootNodeType,
            []
        >]>
    ) => SubgraphDefinitionRef
) => {
    // Begin extraction
    const subgraph = defineSubgraph(new SubgraphDefinition(
        nodeDefinitionMap,
        [new SubgraphPathDefinition(
            nodeDefinitionMap,
            rootNode.nodeType,
            []
        )]
    )) as GenericSubgraphDefinition
    const rootVariable = `n_0`
    let variableList = [rootVariable]    
    let queryString = dedent/*cypher*/`
        match (${rootVariable}:${rootNode.nodeType} {
            ${Object.entries(rootNode).map(([key, value]) => `${key}: "${value as string}"`).join(', ')}
        })\n
    `
    const subgraphRootRelationshipSet = subgraph.subgraphPathDefinitionMap[rootNode.nodeType].subgraphRelationshipSet
    const buildTree = (subgraph: GenericSubgraphDefinition, pathSegment: string, indexedPath: string, pathIdx: string) => {
        const pathLength = pathSegment.split('-').length
        const nextPathSet = subgraph.pathDefinitionSet
            .filter(path => path.pathType.startsWith(pathSegment) 
                && path.pathType.split('-').length === pathLength + 2
            )
        nextPathSet.forEach((nextPath, branchIdx) => {
            const nextPathIdx = `${pathIdx}_${branchIdx}`
            const nextPathSegments = nextPath.pathType.split('-')
            const rightEndcap = nextPath.pathType.replace(pathSegment, '')[0] === '<' ? '-' : '->'
            const leftEndcap = nextPath.pathType.replace(pathSegment, '')[0] === '<' ? '<-' : '-'
            const newVariables = [`p_${nextPathIdx}`, `r_${nextPathIdx}`, `n_${nextPathIdx}`]
            const nextIndexedPath = dedent/*cypher*/`
                ${indexedPath}${leftEndcap}[${newVariables[1]}:${
                    nextPathSegments.slice(nextPathSegments.length - 2, nextPathSegments.length - 1)
                }]${rightEndcap}(${newVariables[2]}:${nextPathSegments[nextPathSegments.length - 1].replace('>', '')})
            `
            queryString += dedent/*cypher*/`
                call {
                    with ${variableList.join(', ')}
                    optional match ${newVariables[0]} = ${nextIndexedPath}
                    return ${newVariables.join(', ')}
                }\n
            `
            variableList.push(...newVariables)
            buildTree(subgraph, nextPath.pathType, nextIndexedPath, nextPathIdx)
        })
    }
    buildTree(subgraph, rootNode.nodeType as string, `(${rootVariable})`, '0')
    queryString += dedent/*cypher*/`
        return ${variableList.join(', ')}
    `
    const resultTree = await neo4jDriver().executeQuery<EagerResult<{
        [Key: `p_${string}`]: Path<Integer>
    } & {
        [Key: `r_${string}`]: Relationship<Integer, GenericRelationshipShape>
    } & {
        [Key: `n_${string}`]: Node<Integer, GenericNodeShape>
    }>>(queryString).then(result => {
        const records = result.records
        const rootNode = result.records[0].get(rootVariable).properties 
        const buildTree = (record: typeof records[number], node: GenericNodeShape & {[r:string]: GenericNodeShape[]}, pathIndex: `p_${string}`) => {
            const nextPathIndexSet = variableList.filter(variable => 
                variable.startsWith(pathIndex)
                && pathIndex.split('_').length === variable.split('_').length - 1
            ) as `p_${string}`[]
            nextPathIndexSet.forEach(nextPathIndex => {
                const segments = record.get(nextPathIndex)?.segments
                if (!segments) return
                const nextPath = segments[segments.length-1]
                const relationship = nextPath.relationship as Relationship<Integer, GenericRelationshipShape>
                const rightEndcap = relationship.start === nextPath.start.identity  ? '->' : '-'
                const leftEndcap = relationship.start === nextPath.end.identity ? '<-' : '-'
                const nextNode = nextPath.end.properties as GenericNodeShape
                const relationshipKey = `${leftEndcap}${relationship.type}${rightEndcap}${nextNode.nodeType}`
                const nextNodeMerged = {
                    ...relationship.properties,
                    ...nextNode,
                }
                node[relationshipKey] = node[relationshipKey] ? [...node[relationshipKey], nextNodeMerged] : [nextNodeMerged]
                buildTree(record, nextNodeMerged as any, nextPathIndex as `p_${string}`)
            })
            return node
        }
        const rootStringIndex = `p_0`
        records.forEach(record => {
            buildTree(record, rootNode as any, rootStringIndex)
        })
        return rootNode
    })
    return Ok(resultTree as SubgraphTree<NodeDefinitionMap, SubgraphDefinitionRef, RootNodeType>)
})

export type NextNodeTypeFromPath<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    PathType extends 
        | keyof NodeDefinitionMap
        | `${string}-${keyof NodeDefinitionMap&string}` 
        | `${string}->${keyof NodeDefinitionMap&string}`
> = PathType extends keyof NodeDefinitionMap
    ? PathType
    : PathType extends `${string}<-${string}-${infer Tail}`
        ? Tail extends keyof NodeDefinitionMap
            ? Tail
            : NextNodeTypeFromPath<NodeDefinitionMap, Tail>
        : PathType extends `${string}-${string}->${infer Tail}`
            ? Tail extends keyof NodeDefinitionMap
                ? Tail
                : NextNodeTypeFromPath<NodeDefinitionMap, Tail>
            : never

export type PreviousNodeTypeFromPath<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    PathType extends 
        | keyof NodeDefinitionMap
        | `${string}-${keyof NodeDefinitionMap&string}` 
        | `${string}->${keyof NodeDefinitionMap&string}`,
    Clipped extends boolean = false
> = Clipped extends false 
        ? PathType extends `${infer Path}<-${NodeDefinitionMap[keyof NodeDefinitionMap]['relationshipDefinitionSet'][number]['type']}-${keyof NodeDefinitionMap&string}`
            ? PreviousNodeTypeFromPath<NodeDefinitionMap, Path, true>
            : PathType extends `${infer Path}-${NodeDefinitionMap[keyof NodeDefinitionMap]['relationshipDefinitionSet'][number]['type']}->${keyof NodeDefinitionMap&string}`
                ? PreviousNodeTypeFromPath<NodeDefinitionMap, Path, true>
                : NextNodeTypeFromPath<NodeDefinitionMap, PathType>
        : NextNodeTypeFromPath<NodeDefinitionMap, PathType>

type SubgraphTree<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    SubgraphDefinitionRef extends AnySubgraphDefinition,
    PathType extends keyof SubgraphDefinitionRef['subgraphPathDefinitionMap'],
> = NodeShape<NodeDefinitionMap[NextNodeTypeFromPath<NodeDefinitionMap, PathType>]> & {
    [Relationship in SubgraphDefinitionRef['subgraphPathDefinitionMap'][PathType]['subgraphRelationshipSet'][number]]?: 
    (
        Relationship extends `-${infer RelationshipType}->${string}`
            ? NodeDefinitionMap[PreviousNodeTypeFromPath<NodeDefinitionMap, PathType>]['relationshipDefinitionSet'][number] extends (infer RelationshipUnionRef extends AnyRelationshipDefinition | never)
                ? AnyRelationshipDefinition extends RelationshipUnionRef
                    ? (RelationshipUnionRef & {type: RelationshipType})['cardinality'] extends `${string}-many`
                        ? (RelationshipState<RelationshipUnionRef&{type: RelationshipType}>&SubgraphTree<
                            NodeDefinitionMap,
                            SubgraphDefinitionRef,
                            `${PathType&string}${Relationship}`
                        >)[]
                        : RelationshipState<RelationshipUnionRef&{type: RelationshipType}>&SubgraphTree<
                            NodeDefinitionMap,
                            SubgraphDefinitionRef,
                            `${PathType&string}${Relationship}`
                        >
                    : unknown 
                : unknown
            : Relationship extends `<-${infer RelationshipType}-${infer RelatedNodeType}`
                ? NodeDefinitionMap[RelatedNodeType]['relationshipDefinitionSet'][number] extends (infer RelationshipUnionRef extends AnyRelationshipDefinition | never)
                    ? AnyRelationshipDefinition extends RelationshipUnionRef
                        ? (RelationshipUnionRef & {type: RelationshipType})['cardinality'] extends `many-${string}`
                            ? (RelationshipState<RelationshipUnionRef&{type: RelationshipType}>&SubgraphTree<
                                NodeDefinitionMap,
                                SubgraphDefinitionRef,
                                `${PathType&string}${Relationship}`
                            >)[]
                            : RelationshipState<RelationshipUnionRef&{type: RelationshipType}>&SubgraphTree<
                                NodeDefinitionMap,
                                SubgraphDefinitionRef,
                                `${PathType&string}${Relationship}`
                            >
                        : unknown
                    : unknown
                : unknown
    )
}



