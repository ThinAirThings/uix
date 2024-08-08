import { AnyNodeDefinitionMap, NodeState } from "../definitions/NodeDefinition"
import { RelationshipState } from "../definitions/RelationshipDefinition"
import { RelationshipUnion } from "./RelationshipUnion"

export type MergeInputTree<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    NodeType extends keyof NodeDefinitionMap,
> = NodeState<NodeDefinitionMap[NodeType]>&{nodeId?:string, nodeType?: NodeType} & {
    [Relationship in RelationshipUnion<NodeDefinitionMap, NodeType>]?: (
        Relationship extends `-${infer RelationshipType}->${infer RelatedNodeType}`
        ? {
            [id: string]: RelationshipState<
                NodeDefinitionMap[NodeType]['relationshipDefinitionMap'][RelationshipType]
            > & MergeInputTree<NodeDefinitionMap, RelatedNodeType>
        }
        : Relationship extends `<-${infer RelationshipType}-${infer RelatedNodeType}`
            ? {
                [id: string]: RelationshipState<
                    NodeDefinitionMap[RelatedNodeType]['relationshipDefinitionMap'][RelationshipType]
                > & MergeInputTree<NodeDefinitionMap, RelatedNodeType>
            }
            : unknown
    )
}