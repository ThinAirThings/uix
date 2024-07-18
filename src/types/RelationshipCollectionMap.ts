import { AnyNodeDefinitionMap } from "../definitions/NodeDefinition";
import { AnyRelationshipDefinition, RelationshipDefinition } from "../definitions/RelationshipDefinition";


export type CollectOptions = {
    limit?: number
    page?: number
    orderBy?: 'updatedAt' | 'createdAt';
    orderDirection?: 'ASC' | 'DESC';
}

type NodeTypeByRelationshipType<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    NodeType extends keyof NodeDefinitionMap,
    RelationshipType extends AnyRelationshipDefinition['type'],
    Direction extends 'to' | 'from'
> = (
    (NodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number] 
        & {type: RelationshipType}
    ) extends RelationshipDefinition<
        infer FromNodeDefinition,
        any,
        any,
        any,
        infer ToNodeDefinition,
        any
    > ? Direction extends 'to' ? ToNodeDefinition['type'] : FromNodeDefinition['type']
    : never
)
export type RelationshipCollectionMap<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    NodeType extends keyof NodeDefinitionMap,
> = (
    (NodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number] extends (infer RelationshipDefinitionUnion extends AnyRelationshipDefinition | never)
        ? ((AnyRelationshipDefinition extends RelationshipDefinitionUnion
            ? ({
                [ToRelationshipType in RelationshipDefinitionUnion['type']]?: {
                    to: {
                        [ToNodeType in NodeTypeByRelationshipType<NodeDefinitionMap, NodeType, ToRelationshipType, 'to'>]?: {
                            options?: CollectOptions
                            relatedBy?: RelationshipCollectionMap<NodeDefinitionMap, ToNodeType>
                        }  
                    }
                }
            })
            : unknown
        )) 
        : never
) & (
    (NodeDefinitionMap[keyof NodeDefinitionMap]['relationshipDefinitionSet'][number] extends (infer RelationshipDefinitionUnion extends AnyRelationshipDefinition | never)
        ? ((AnyRelationshipDefinition extends RelationshipDefinitionUnion
            ? ({
                [FromRelationshipType in ({
                    [RelationshipType in RelationshipDefinitionUnion['type']]: NodeType extends (RelationshipDefinitionUnion & {type: RelationshipType})['toNodeDefinition']['type'] 
                        ? RelationshipType 
                        : never
                }[RelationshipDefinitionUnion['type']])]?: {
                    from: {
                        [FromNodeType in (RelationshipDefinitionUnion & {type: FromRelationshipType})['fromNodeDefinition']['type']]?: {
                            options?: CollectOptions
                            relatedBy?: RelationshipCollectionMap<NodeDefinitionMap, FromNodeType>
                        }
                    }
                }
            })
            : unknown
        ))
        : unknown
)
))
