import { AnyNodeDefinitionMap, NodeShape } from "../definitions/NodeDefinition"
import { RelationshipMerge, RelationshipState } from "../definitions/RelationshipDefinition"
import { AnySubgraphDefinition } from "../definitions/SubgraphDefinition"


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

export type ExtractOutputTreeWithoutRelationshipMetadata<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    SubgraphDefinitionRef extends AnySubgraphDefinition,
    PathType extends keyof SubgraphDefinitionRef['subgraphPathDefinitionMap'],
> = NodeShape<NodeDefinitionMap[NextNodeTypeFromPath<NodeDefinitionMap, PathType>]> & {
    [Relationship in SubgraphDefinitionRef['subgraphPathDefinitionMap'][PathType]['subgraphRelationshipSet'][number]]?: 
    (
        Relationship extends `-${infer RelationshipType}->${string}`
            ? {
                [id: string]: RelationshipState<
                    NodeDefinitionMap[PreviousNodeTypeFromPath<NodeDefinitionMap, PathType>]['relationshipDefinitionMap'][RelationshipType]
                > & ExtractOutputTree<
                    NodeDefinitionMap,
                    SubgraphDefinitionRef,
                    `${PathType&string}${Relationship}`
                >
            }
            : Relationship extends `<-${infer RelationshipType}-${infer RelatedNodeType}`
                ? {
                    [id: string]: RelationshipState<
                        NodeDefinitionMap[RelatedNodeType]['relationshipDefinitionMap'][RelationshipType]
                    > & ExtractOutputTree<
                            NodeDefinitionMap,
                        SubgraphDefinitionRef,
                        `${PathType&string}${Relationship}`
                    >
                }
                : unknown
    )
}
// 
export type ExtractOutputTree<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    SubgraphDefinitionRef extends AnySubgraphDefinition,
    PathType extends keyof SubgraphDefinitionRef['subgraphPathDefinitionMap'],
> = NodeShape<NodeDefinitionMap[NextNodeTypeFromPath<NodeDefinitionMap, PathType>]> & {
    [Relationship in SubgraphDefinitionRef['subgraphPathDefinitionMap'][PathType]['subgraphRelationshipSet'][number]]?: 
    (
        Relationship extends `-${infer RelationshipType}->${string}`
            ? {
                    [id: string]: RelationshipMerge<
                        NodeDefinitionMap,
                        PreviousNodeTypeFromPath<NodeDefinitionMap, PathType>,
                        RelationshipType
                    > & ExtractOutputTree<
                        NodeDefinitionMap,
                        SubgraphDefinitionRef,
                        `${PathType&string}${Relationship}`
                    >
                }
            : Relationship extends `<-${infer RelationshipType}-${infer RelatedNodeType}`
                ? {
                    [id: string]: RelationshipMerge<
                        NodeDefinitionMap,
                        RelatedNodeType,
                        RelationshipType
                    > & ExtractOutputTree<
                            NodeDefinitionMap,
                        SubgraphDefinitionRef,
                        `${PathType&string}${Relationship}`
                    >
                }
                : unknown
    )
}