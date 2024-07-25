import { AnyNodeDefinitionMap, NodeShape } from "../definitions/NodeDefinition";
import { AnyRelationshipDefinition, AnyRelationshipDefinitionSet } from "../definitions/RelationshipDefinition";


export type RelationshipUnion<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    NodeType extends keyof NodeDefinitionMap,
> = (NodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number] extends (infer RelationshipUnionRef extends AnyRelationshipDefinition | never)
    ? AnyRelationshipDefinition extends RelationshipUnionRef
        ? {
            [RelationshipType in RelationshipUnionRef['type']]: NodeType extends (RelationshipUnionRef & { type: RelationshipType })['fromNodeDefinition']['type']
                ? `-${RelationshipType}->${(RelationshipUnionRef & { type: RelationshipType })['toNodeDefinition']['type']}`
                : never
        }[RelationshipUnionRef['type']]
        : never
    : never
) | (
    NodeDefinitionMap[keyof NodeDefinitionMap]['relationshipDefinitionSet'][number] extends (infer RelationshipUnionRef extends AnyRelationshipDefinition | never)
        ? AnyRelationshipDefinition extends RelationshipUnionRef
            ? {
                [RelationshipType in RelationshipUnionRef['type']]: (NodeType) extends (RelationshipUnionRef&{type: RelationshipType})['toNodeDefinition']['type']
                ? `<-${RelationshipType}-${(RelationshipUnionRef & {type: RelationshipType})['fromNodeDefinition']['type']}`
                : never
            }[RelationshipUnionRef['type']]
            : never
        : never
)