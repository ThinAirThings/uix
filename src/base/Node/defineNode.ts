import { ZodObject } from "zod";
import { NodeDefinition } from "./NodeDefinition";





export const defineNode = <
    T extends Capitalize<string>,
    StateDefinition extends ZodObject<any>,
>(nodeType: T, stateDefinition: StateDefinition) => new NodeDefinition(nodeType, stateDefinition);