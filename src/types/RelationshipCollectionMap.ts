import { AnyNodeDefinitionMap } from "../definitions/NodeDefinition";
import { AnyRelationshipDefinition, RelationshipDefinition } from "../definitions/RelationshipDefinition";


export type CollectOptions = {
    limit?: number
    page?: number
    orderBy?: 'updatedAt' | 'createdAt';
    orderDirection?: 'ASC' | 'DESC';
}

export type NodeTypeByRelationshipType<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    NodeType extends keyof NodeDefinitionMap,
    RelationshipType extends AnyRelationshipDefinition['type'],
    Direction extends 'to' | 'from'
> = (
        (NodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number]
            & { type: RelationshipType }
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
                    [ToRelationshipType in RelationshipDefinitionUnion['type']]?: ({
                        direction: 'to'
                    }) & ({
                        [ToNodeType in NodeTypeByRelationshipType<NodeDefinitionMap, NodeType, ToRelationshipType, 'to'>]?: ({
                            nodeType: ToNodeType
                            options?: CollectOptions
                        }) & RelationshipCollectionMap<NodeDefinitionMap, ToNodeType>
                    }[NodeTypeByRelationshipType<NodeDefinitionMap, NodeType, ToRelationshipType, 'to'>])
                })
                : unknown
            ))
            : never
        ) & (
            (NodeDefinitionMap[keyof NodeDefinitionMap]['relationshipDefinitionSet'][number] extends (infer RelationshipDefinitionUnion extends AnyRelationshipDefinition | never)
                ? ((AnyRelationshipDefinition extends RelationshipDefinitionUnion
                    ? ({
                        [FromRelationshipType in ({
                            [RelationshipType in RelationshipDefinitionUnion['type']]: NodeType extends (RelationshipDefinitionUnion & { type: RelationshipType })['toNodeDefinition']['type']
                            ? RelationshipType
                            : never
                        }[RelationshipDefinitionUnion['type']])]?: ({
                            direction: 'from'
                        }) & ({
                            [FromNodeType in (RelationshipDefinitionUnion & { type: FromRelationshipType })['fromNodeDefinition']['type']]?: ({
                                nodeType: FromNodeType
                                options?: CollectOptions
                            }) & RelationshipCollectionMap<NodeDefinitionMap, FromNodeType>
                        }[(RelationshipDefinitionUnion & { type: FromRelationshipType })['fromNodeDefinition']['type']])
                    })
                    : unknown
                ))
                : unknown
            )
        ))

// This needs to be a class to recursively interpret the type
