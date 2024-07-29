import dedent from "dedent";
import { neo4jAction } from "../clients/neo4j";
import { AnyNodeDefinitionMap, NodeDefinitionMap, NodeShape } from "../definitions/NodeDefinition";
import { AnySubgraphDefinition, GenericSubgraphDefinition, SubgraphDefinition } from "../definitions/SubgraphDefinition";
import { Ok } from "../types/Result";
import { SubgraphPathDefinition } from "../definitions/SubgraphPathDefinition";
import { AnyRelationshipDefinition } from "../definitions/RelationshipDefinition";






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
    const rootVariable = `n_T${rootNode.nodeType as string}`
    console.log(JSON.stringify(subgraph.subgraphPathDefinitionMap, null, 2))
    let variableList = [rootVariable]
    const subgraphRootRelationshipSet = subgraph.subgraphPathDefinitionMap[rootNode.nodeType].subgraphRelationshipSet
    let queryString = dedent/*cypher*/`
        match (${rootVariable}:${rootNode.nodeType} {
            ${Object.entries(rootNode).map(([key, value]) => `${key}: "${value as string}"`).join(', ')}
        })
        ${subgraphRootRelationshipSet.length 
            ? subgraphRootRelationshipSet.map(relationship => dedent/*cypher*/`
                optional match p_${rootVariable}${relationship} = (${rootVariable})${
                    relationship.split('-')
                    .map((seg, idx) => 
                        idx === 1 ? `-[${seg}]-` 
                        : idx === 2 ? `(${seg.replace('>', '')})`
                        : ''
                    )
                    .join('')
                }
            `).join('\n')
            : ''
        } 
    `
    // queryString += Object.entries(subgraph.subgraphPathDefinitionMap).map(([pathType, path]) => {
        
    // })
    return Ok(queryString as SubgraphTree<NodeDefinitionMap, SubgraphDefinitionRef, RootNodeType>)

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
    [Relationship in SubgraphDefinitionRef['subgraphPathDefinitionMap'][PathType]['subgraphRelationshipSet'][number]]: 
    (
        Relationship extends `-${infer RelationshipType}->${string}`
            ? NodeDefinitionMap[PreviousNodeTypeFromPath<NodeDefinitionMap, PathType>]['relationshipDefinitionSet'][number] extends (infer RelationshipUnionRef extends AnyRelationshipDefinition | never)
                ? AnyRelationshipDefinition extends RelationshipUnionRef
                    ? (RelationshipUnionRef & {type: RelationshipType})['cardinality'] extends `${string}-many`
                        ? SubgraphTree<
                            NodeDefinitionMap,
                            SubgraphDefinitionRef,
                            `${PathType&string}${Relationship}`
                        >[]
                        : SubgraphTree<
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
                            ? SubgraphTree<
                                NodeDefinitionMap,
                                SubgraphDefinitionRef,
                                `${PathType&string}${Relationship}`
                            >[]
                            : SubgraphTree<
                                NodeDefinitionMap,
                                SubgraphDefinitionRef,
                                `${PathType&string}${Relationship}`
                            >
                        : unknown
                    : unknown
                : unknown
    )
}



