import { ZodObject } from "zod"





export type RelationshipDefinition<
    FromNode extends readonly string[],
    T extends Uppercase<string>,
    ToNode extends readonly string[],
    StateDefinition extends ZodObject<any> | undefined = undefined,
> = {
    fromNode: FromNode,
    relationshipType: T,
    toNode: ToNode
    stateDefinition?: StateDefinition
}