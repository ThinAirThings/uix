import { TypeOf, ZodTypeAny } from "zod";
import { AnyNodeDefinitionMap } from "../definitions/NodeDefinition";
import { AnyRelationshipDefinition, RelationshipDefinition, StrengthTypeSet } from "../definitions/RelationshipDefinition";
import { NodeKeyByCardinality } from "./NodeKeyByCardinality";


export type IsPartial<T, Condition extends boolean> = Condition extends true ? Partial<T> : T
export type RelationshipMergeMap<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    NodeType extends keyof NodeDefinitionMap,
    Strength extends StrengthTypeSet
> = (
    NodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number] & { strength: Strength } extends (infer RelationshipDefinitionRef extends AnyRelationshipDefinition | never)
    ? IsPartial<(
        AnyRelationshipDefinition extends RelationshipDefinitionRef
        ? ({
            [ToRelationshipType in RelationshipDefinitionRef['type']]: (RelationshipDefinitionRef & { type: ToRelationshipType })['stateSchema'] extends (infer StateSchema extends ZodTypeAny)
            ? ({
                to: NodeKeyByCardinality<NodeDefinitionMap, NodeType, Strength, ToRelationshipType, 'to'>
                state: TypeOf<StateSchema>
            })
            : ({
                to: NodeKeyByCardinality<NodeDefinitionMap, NodeType, Strength, ToRelationshipType, 'to'>
            })
        })
        : Strength extends 'strong' ? undefined : unknown
    ), Strength extends 'weak' ? true : false>
    : never
) & (
        (
            Strength extends 'weak'
            ? (
                (NodeDefinitionMap[keyof NodeDefinitionMap]['relationshipDefinitionSet'][number] & { strength: Strength }) extends (infer RelationshipDefinitionRef extends AnyRelationshipDefinition | never)
                ? AnyRelationshipDefinition extends RelationshipDefinitionRef
                ? ({
                    [FromRelationshipType in NodeType extends RelationshipDefinitionRef['toNodeDefinition']['type'] ? RelationshipDefinitionRef['type'] : never]?: (
                        RelationshipDefinitionRef & { type: FromRelationshipType }) extends RelationshipDefinition<infer FromNodeDefinition, any, any, any, infer ToNodeDefinition, infer StateSchemaRef>
                    ? NodeType extends ToNodeDefinition['type']
                    ? StateSchemaRef extends ZodTypeAny
                    ? ({
                        from: NodeKeyByCardinality<NodeDefinitionMap, FromNodeDefinition['type'], Strength, FromRelationshipType, 'from'>
                        state: TypeOf<StateSchemaRef>
                    })
                    : ({
                        from: NodeKeyByCardinality<NodeDefinitionMap, FromNodeDefinition['type'], Strength, FromRelationshipType, 'from'>
                    })
                    : never
                    : never
                })
                : unknown
                : never
            )
            : unknown
        ) extends (infer ReverseWeakRelationshipMap)
        ? {} extends Required<ReverseWeakRelationshipMap>
        ? unknown
        : ReverseWeakRelationshipMap
        : 'this is a type error with uix. please file a bug'
    )
