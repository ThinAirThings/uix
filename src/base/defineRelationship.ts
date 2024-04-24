
import { ZodObject } from "zod";


export const defineRelationship = <
    T extends Uppercase<string>,
    SD extends ZodObject<any>,
>(
    nodeType: T,
    stateDefinition?: SD
) => ({
    nodeType,
    stateDefinition
})