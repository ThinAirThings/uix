import { AnyNodeDefinitionMap, NodeState } from "../definitions/NodeDefinition"
import { RelationshipState } from "../definitions/RelationshipDefinition"

export type ConcreteMergeInputTree<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    NodeType extends keyof NodeDefinitionMap,
    StateTree extends {nodeType: NodeType} & Record<string, any>
> = NodeState<NodeDefinitionMap[NodeType]> & {
        [Relationship in keyof StateTree as Exclude<Relationship, keyof NodeState<NodeDefinitionMap[NodeType]>>]: (
            Relationship extends `-${infer RelationshipType}->${infer RelatedNodeType}`
                ? {
                    [id: string]: RelationshipState<
                        NodeDefinitionMap[StateTree['nodeType']]['relationshipDefinitionMap'][RelationshipType]
                    > & ConcreteMergeInputTree<NodeDefinitionMap, RelatedNodeType, StateTree[Relationship][keyof StateTree[Relationship]]>
                }
            : Relationship extends `<-${infer RelationshipType}-${infer RelatedNodeType}`
                ? {
                    [id: string]: RelationshipState<
                        NodeDefinitionMap[RelatedNodeType]['relationshipDefinitionMap'][RelationshipType]
                    > & ConcreteMergeInputTree<NodeDefinitionMap, RelatedNodeType, StateTree[Relationship][keyof StateTree[Relationship]]>
                }
                : unknown
    )
}