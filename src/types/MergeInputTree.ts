import { AnyNodeDefinitionMap, NodeState } from "../definitions/NodeDefinition"
import { RelationshipState } from "../definitions/RelationshipDefinition"
import { RelationshipUnion } from "./RelationshipUnion"

type ExistenceModifiers = {
    detach?: boolean
    delete?: boolean
}

export type DeepPartial<T> = {
    [P in keyof T]?: DeepPartial<T[P]>
}
export type MergeInputTree<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    NodeType extends keyof NodeDefinitionMap,
> = (NodeState<NodeDefinitionMap[NodeType]> & {
        nodeId?: string
        delete?: boolean
    } & {
    [Relationship in RelationshipUnion<NodeDefinitionMap, NodeType>]?: (
        Relationship extends `-${infer RelationshipType}->${infer RelatedNodeType}`
        ? {
            [id: string]: {
                detach?: boolean
            } & RelationshipState<
                NodeDefinitionMap[NodeType]['relationshipDefinitionMap'][RelationshipType]
            > & MergeInputTree<NodeDefinitionMap, RelatedNodeType>
        }
        : Relationship extends `<-${infer RelationshipType}-${infer RelatedNodeType}`
            ? {
                [id: string]: {
                    detach?: boolean
                }&RelationshipState<
                    NodeDefinitionMap[RelatedNodeType]['relationshipDefinitionMap'][RelationshipType]
                > & MergeInputTree<NodeDefinitionMap, RelatedNodeType>
            }
            : never
    )
})