import dedent from "dedent";
import { neo4jAction, neo4jDriver } from "../clients/neo4j";
import { AnyNodeDefinitionMap, GenericNodeShape, NodeDefinitionMap, NodeShape } from "../definitions/NodeDefinition";
import { AnySubgraphDefinition, GenericSubgraphDefinition, SubgraphDefinition } from "../definitions/SubgraphDefinition";
import { Ok, UixErr } from "../types/Result";
import { SubgraphPathDefinition } from "../definitions/SubgraphPathDefinition";
import { AnyRelationshipDefinition, GenericRelationshipShape, RelationshipState } from "../definitions/RelationshipDefinition";
import { EagerResult, Integer, Node, Path, Relationship } from "neo4j-driver";
import { writeFileSync } from "fs";
import { ExtractOutputTree } from "../types/ExtractOutputTree";


export type GenericMergeOutputTree = GenericNodeShape | {
    [key: string]: GenericMergeOutputTree
}

export const extractSubgraphFactory = <
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
    subgraphArg?: ((subgraph: SubgraphDefinition<
        NodeDefinitionMap, 
        [SubgraphPathDefinition<
            NodeDefinitionMap,
            RootNodeType,
            []
        >]>
    ) => SubgraphDefinitionRef) | SubgraphDefinitionRef
) => {
    // Begin extraction
    const subgraph = ((subgraphArg instanceof Function ? subgraphArg(new SubgraphDefinition(
        nodeDefinitionMap,
        [new SubgraphPathDefinition(
            nodeDefinitionMap,
            rootNode.nodeType,
            []
        )]
    )) : subgraphArg) ?? new SubgraphDefinition(
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
            ${nodeDefinitionMap[rootNode.nodeType]!.uniqueIndexes
                .filter((index:string) => !!rootNode[index as keyof typeof rootNode])
                .map((index: any) => `${index}: "${rootNode[index as keyof typeof rootNode]}"`).join(', ')
            }
        })\n
    `
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
        // writeFileSync('tests/extract:records.json', JSON.stringify(result.records, null, 2))
        // writeFileSync('tests/extract:queryString.cypher', queryString)
        const records = result.records
        const rootNode = records?.[0]?.get(rootVariable)?.properties 
        if (!rootNode) return null
        const buildTree = (
            node: GenericNodeShape & {
                [r:string]: {
                    [id: string]: GenericNodeShape
                }
            }, 
            pathIndex: `p_${string}`
        ) => {
            const nextPathIndexSet = variableList.filter(variable => 
                variable.startsWith(pathIndex)
                && pathIndex.split('_').length === variable.split('_').length - 1
            ) as `p_${string}`[]
            nextPathIndexSet.forEach(nextPathIndex => {
                records.forEach(record => {
                    const segments = record.get(nextPathIndex)?.segments
                    if (!segments) return
                    const nextPath = segments[segments.length-1]!
                    const relationship = nextPath.relationship as Relationship<Integer, GenericRelationshipShape>
                    const rightEndcap = relationship.start === nextPath.start.identity  ? '->' : '-'
                    const leftEndcap = relationship.start === nextPath.end.identity ? '<-' : '-'
                    const nextNode = nextPath.end.properties as GenericNodeShape
                    const relationshipKey = `${leftEndcap}${relationship.type}${rightEndcap}${nextNode.nodeType}`
                    const nextNodeMerged = {
                        ...relationship.properties,
                        ...nextNode,
                    }
                    node[relationshipKey] = node[relationshipKey] 
                    ? {
                        ...node[relationshipKey],
                        [nextNodeMerged.nodeId]: nextNodeMerged
                    }
                    :{
                        [nextNodeMerged.nodeId]: nextNodeMerged
                    }
                    buildTree(nextNodeMerged as any, nextPathIndex as `p_${string}`)
                })
            })
            return node
        }
        const rootStringIndex = `p_0`
        buildTree(rootNode as any, rootStringIndex)
        return rootNode
    })
    // writeFileSync('tests/extract:resultTree.json', JSON.stringify(resultTree, null, 2))
    if (!resultTree) return UixErr({
        subtype: 'ExpectedRuntimeError',
        message: "The root node requested was not found. This is likely due to it not existing in the database.",
        data: {
            rootNode: rootNode,
        }
    })
    return Ok(resultTree as ExtractOutputTree<NodeDefinitionMap, SubgraphDefinitionRef, RootNodeType>)
})



