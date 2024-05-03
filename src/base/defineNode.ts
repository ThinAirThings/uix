import { TypeOf, ZodDefault, ZodObject, z } from "zod";


// // Note this will extract the actual zod type
type InferZodSchema<T> = {
    [P in keyof T]: T[P] extends ZodDefault<infer U> ? U : never;
};


export class NodeDefinition<T extends string, StateDefinition extends ZodObject<any>, StateDefaults extends ZodObject<any> = ZodObject<{}>> {
    nodeType: T;
    stateDefinition: StateDefinition;
    stateDefaults: StateDefaults;

    constructor(nodeType: T, stateDefinition: StateDefinition, stateDefaults?: StateDefaults) {
        this.nodeType = nodeType;
        this.stateDefinition = stateDefinition;
        this.stateDefaults = stateDefaults ?? z.object({}) as StateDefaults;
    }

    defaults<Defaults extends { [K in keyof TypeOf<StateDefinition>]?: ZodDefault<StateDefinition['shape'][K]> }>(
        defineDefaults: (stateDefinition: StateDefinition['shape']) => Defaults
    ): NodeDefinition<T, StateDefinition, ZodObject<InferZodSchema<Defaults>>> {
        const defaultsDefinition = defineDefaults(this.stateDefinition.shape);
        const defaultsSchema = z.object(defaultsDefinition as any) as ZodObject<InferZodSchema<Defaults>>;
        return new NodeDefinition<T, StateDefinition, ZodObject<InferZodSchema<Defaults>>>(this.nodeType, this.stateDefinition, defaultsSchema);
    }
}

export const defineNode = <
    T extends Capitalize<string>,
    StateDefinition extends ZodObject<any>,
>(nodeType: T, stateDefinition: StateDefinition) => new NodeDefinition(nodeType, stateDefinition);

