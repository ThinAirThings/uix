import { ZodObject } from "zod"
import { NodeDefinition } from "../Node/NodeDefinition"
import { RelationshipDefinition } from "./RelationshipDefinition"





export const defineRelationshipFactory = <
    NodeDefinitions extends readonly NodeDefinition[],
>(
    nodeDefinitions: NodeDefinitions
) => class ConstrainedRelationshipDefinition<
    FromNodeType extends NodeDefinitions[number]['nodeType'],
    RelationshipType extends Uppercase<string>,
    ToNodeType extends NodeDefinitions[number]['nodeType'],
    StateSchema extends ZodObject<any> | undefined = undefined
> extends RelationshipDefinition<FromNodeType, RelationshipType, ToNodeType, StateSchema> {
        constructor(
            relationshipType: RelationshipType,
            fromNodeType: FromNodeType,
            toNodeType: ToNodeType,
            options?: {
                stateSchema?: StateSchema
            }
        ) {
            super(relationshipType, fromNodeType, toNodeType, options)
        }
        stateDefinition<StateSchema extends ZodObject<any>>(
            stateSchema: StateSchema
        ) {
            return new ConstrainedRelationshipDefinition(
                this.relationshipType,
                this.fromNodeType,
                this.toNodeType,
                {
                    stateSchema
                }
            )
        }
    }