import { ZodObject } from "zod";





export const defineNode = <
    T extends Capitalize<string>,
    SD extends ZodObject<any>,
>(
    nodeType: T,
    stateDefinition: SD,
): {
    nodeType: T,
    stateDefinition: SD,
} => ({
    nodeType,
    stateDefinition,
})