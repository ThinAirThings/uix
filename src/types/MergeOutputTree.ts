import { AnyNodeDefinitionMap, GenericNodeShape, NodeShape } from "../definitions/NodeDefinition";
import { AnyRelationshipDefinition, RelationshipState } from "../definitions/RelationshipDefinition";
import { MergeInputTree } from "./MergeInputTree";

export type GenericMergeOutputTree = GenericNodeShape | {
    [key: string]: GenericMergeOutputTree
}


export type MergeOutputTree<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    NodeType extends keyof NodeDefinitionMap,
    StateTree extends {nodeType: NodeType} & Record<string, any>
> = NodeShape<NodeDefinitionMap[NodeType]> & {
        [Relationship in keyof StateTree as Exclude<Relationship, keyof NodeShape<NodeDefinitionMap[NodeType]>>]: (
            Relationship extends `-${infer RelationshipType}->${infer RelatedNodeType}`
                ? {
                    [id: string]: RelationshipState<
                        NodeDefinitionMap[StateTree['nodeType']]['relationshipDefinitionMap'][RelationshipType]
                    > & MergeOutputTree<NodeDefinitionMap, RelatedNodeType, StateTree[Relationship][keyof StateTree[Relationship]]>
                }
            : Relationship extends `<-${infer RelationshipType}-${infer RelatedNodeType}`
                ? {
                    [id: string]: RelationshipState<
                        NodeDefinitionMap[RelatedNodeType]['relationshipDefinitionMap'][RelationshipType]
                    > & MergeOutputTree<NodeDefinitionMap, RelatedNodeType, StateTree[Relationship][keyof StateTree[Relationship]]>
                }
                : unknown
    )
}