import { AnyNodeDefinitionMap, NodeShape } from "../definitions/NodeDefinition";
import { RelationshipState } from "../definitions/RelationshipDefinition";

export type RelationshipUnion<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    NodeType extends keyof NodeDefinitionMap,
> = ({
    [RelationshipType in keyof NodeDefinitionMap[NodeType]['relationshipDefinitionMap']]: 
        `-${RelationshipType&string}->${NodeDefinitionMap[NodeType]['relationshipDefinitionMap'][RelationshipType]['toNodeDefinition']['type']}`
    }[keyof NodeDefinitionMap[NodeType]['relationshipDefinitionMap']]
) | {
    [FromNodeType in keyof NodeDefinitionMap]: {
        [RelationshipType in keyof NodeDefinitionMap[FromNodeType]['relationshipDefinitionMap']]:
            NodeType extends NodeDefinitionMap[FromNodeType]['relationshipDefinitionMap'][RelationshipType]['toNodeDefinition']['type']
                ? `<-${RelationshipType&string}-${FromNodeType&string}`
                : never
    }[keyof NodeDefinitionMap[FromNodeType]['relationshipDefinitionMap']]
}[keyof NodeDefinitionMap]

export type RelationshipTypeUnion<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    NodeType extends keyof NodeDefinitionMap,
> = ({
    [RelationshipType in keyof NodeDefinitionMap[NodeType]['relationshipDefinitionMap']]: 
        RelationshipType
    }[keyof NodeDefinitionMap[NodeType]['relationshipDefinitionMap']]
) | {
    [FromNodeType in keyof NodeDefinitionMap]: {
        [RelationshipType in keyof NodeDefinitionMap[FromNodeType]['relationshipDefinitionMap']]:
            NodeType extends NodeDefinitionMap[FromNodeType]['relationshipDefinitionMap'][RelationshipType]['toNodeDefinition']['type']
                ? RelationshipType
                : never
    }[keyof NodeDefinitionMap[FromNodeType]['relationshipDefinitionMap']]
}[keyof NodeDefinitionMap]

export type RelationshipStateFromRelationshipString<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    NodeType extends keyof NodeDefinitionMap,
    RelationshipString extends RelationshipUnion<NodeDefinitionMap, NodeType>
> = RelationshipString extends `-${infer RelationshipType}->${infer RelatedNodeType}`
    ? RelationshipState<NodeDefinitionMap[NodeType]['relationshipDefinitionMap'][RelationshipType]>
    : RelationshipString extends `<-${infer RelationshipType}-${infer RelatedNodeType}`
        ? RelationshipState<NodeDefinitionMap[RelatedNodeType]['relationshipDefinitionMap'][RelationshipType]>
        : never