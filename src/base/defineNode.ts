import { ZodObject } from "zod";


export const defineNode = <
    T extends Capitalize<string>,
    SD extends ZodObject<any>,
    R extends readonly Uppercase<string>[]
>(
    nodeType: T,
    stateDefinition: SD,
    relationships: R
) => ({
    nodeType,
    stateDefinition,
    relationships
})