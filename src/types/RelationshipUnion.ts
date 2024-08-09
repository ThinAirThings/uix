import { AnyNodeDefinitionMap, NodeShape } from "../definitions/NodeDefinition";

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
