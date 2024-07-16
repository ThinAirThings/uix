import { TypeOf, ZodObject, ZodType, ZodTypeAny } from "zod";
import { AnyNodeDefinitionMap, GenericNodeDefinitionMap } from "../definitions/NodeDefinition";
import { AnyRelationshipDefinition, RelationshipDefinition, StrengthTypeSet } from "../definitions/RelationshipDefinition";
import { NodeKey } from "./NodeKey";


type NodeKeyByCardinality<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    NodeType extends keyof NodeDefinitionMap,
    Strength extends StrengthTypeSet,
    RelationshipType extends (NodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number] & { strength: Strength })['type'],
    RelationshipDirection extends 'to' | 'from'
> = ((NodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number] & { strength: Strength }) & { type: RelationshipType })['cardinality'] extends ('one-to-one' | 'many-to-one')
    ? NodeKey<NodeDefinitionMap, ((NodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number] & { strength: Strength }) & { type: RelationshipType })[`${RelationshipDirection}NodeDefinition`]['type']>
    : NodeKey<NodeDefinitionMap, ((NodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number] & { strength: Strength }) & { type: RelationshipType })[`${RelationshipDirection}NodeDefinition`]['type']>[]

export type AnyRelativeRelationshipMap = RelativeRelationshipMap<any, any, any>
export type GenericRelativeRelationshipMap = RelativeRelationshipMap<GenericNodeDefinitionMap, keyof GenericNodeDefinitionMap, StrengthTypeSet>
export type RelativeRelationshipMap<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    NodeType extends keyof NodeDefinitionMap,
    Strength extends StrengthTypeSet
> = Strength extends 'strong'
    ? (AnyRelationshipDefinition extends (NodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number] & { strength: Strength })
        ? {
            strongRelationshipMap: ({
                [ToRelationshipType in (NodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number] & { strength: Strength })['type']]: ((NodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number] & { strength: Strength }) & { type: ToRelationshipType })['stateSchema'] extends ZodType<infer A, infer B, infer C>
                ? ({
                    to: NodeKeyByCardinality<NodeDefinitionMap, NodeType, Strength, ToRelationshipType, 'to'>
                    state: TypeOf<ZodType<A, B, C>>
                })
                : ({
                    to: NodeKeyByCardinality<NodeDefinitionMap, NodeType, Strength, ToRelationshipType, 'to'>
                })
            })
        }
        : { strongRelationshipMap?: undefined }
    )
    : Strength extends 'weak'
    ? (
        (AnyRelationshipDefinition extends (NodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number] & { strength: 'weak' })
            ? {
                weakRelationshipMap?: ({
                    [ToRelationshipType in (NodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number] & { strength: Strength })['type']]?: (
                        (NodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number] & { strength: Strength }) & { type: ToRelationshipType }
                    )['stateSchema'] extends ZodType<infer A, infer B, infer C>
                    ? ({
                        to: NodeKeyByCardinality<NodeDefinitionMap, NodeType, Strength, ToRelationshipType, 'to'>
                        state: TypeOf<ZodType<A, B, C>>
                    })
                    : ({
                        to: NodeKeyByCardinality<NodeDefinitionMap, NodeType, Strength, ToRelationshipType, 'to'>
                    })
                })
            }
            : { weakRelationshipMap?: unknown }
        )
        & ({
            weakRelationshipMap?: AnyRelationshipDefinition extends (NodeDefinitionMap[keyof NodeDefinitionMap]['relationshipDefinitionSet'][number] & { strength: Strength })
            ? ({
                [FromRelationshipType in ((NodeDefinitionMap[keyof NodeDefinitionMap]['relationshipDefinitionSet'][number] & { strength: Strength }) extends RelationshipDefinition<
                    any, infer RelationshipType, any, any, infer ToNodeDefinition, any
                > ? NodeType extends ToNodeDefinition['type'] ? RelationshipType : never : never)
                ]?: (
                    (NodeDefinitionMap[keyof NodeDefinitionMap]['relationshipDefinitionSet'][number] & { strength: Strength }) & { type: FromRelationshipType }
                ) extends RelationshipDefinition<infer FromNodeDefinition, any, any, any, infer ToNodeDefinition, any>
                ? NodeType extends ToNodeDefinition['type']
                ? ((NodeDefinitionMap[keyof NodeDefinitionMap]['relationshipDefinitionSet'][number] & { strength: Strength }) & { type: FromRelationshipType })['stateSchema'] extends ZodType<infer A, infer B, infer C>
                ? ({
                    from: NodeKeyByCardinality<NodeDefinitionMap, FromNodeDefinition['type'], Strength, FromRelationshipType, 'from'>
                    state: TypeOf<ZodType<A, B, C>>
                }) : ({
                    from: NodeKeyByCardinality<NodeDefinitionMap, FromNodeDefinition['type'], Strength, FromRelationshipType, 'from'>
                })
                : never
                : never
            })
            : unknown
        })
    ) extends { weakRelationshipMap?: infer ResultType } ? unknown extends ResultType ? { weakRelationshipMap?: undefined } : { weakRelationshipMap?: ResultType } : never
    : never