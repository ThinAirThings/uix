import { TypeOf, ZodDefault, ZodObject, ZodOptional, ZodTypeAny, z } from "zod";


type UnwrapZodOptional<T extends ZodTypeAny> = T extends ZodOptional<infer U> ? U : T;

// type Concrete<Type extends Record<string, any>> = {
//     [Property in keyof Type]: Type[Property] extends NonNullable<infer U> ? U : never;
// };
type Concrete<T extends Record<string, any>> = {
    [P in keyof T]: NonNullable<T[P]>;
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

    defaults<Defaults extends { [K in keyof TypeOf<StateDefinition>]?: TypeOf<StateDefinition>[K] }>(
        defaults: Defaults
    ): NodeDefinition<T, StateDefinition, ZodObject<{
        [K in keyof Defaults]: UnwrapZodOptional<StateDefinition['shape'][K]>
    }>> {
        const defaultsDefinition = Object.entries(this.stateDefinition.shape).reduce((acc, [key, value]) => ({
            ...acc,
            [key]: (value as any).default(defaults[key])
        }), {});
        const defaultsSchema = z.object(defaultsDefinition as any) as ZodObject<Concrete<Defaults>>;
        return new NodeDefinition<T, StateDefinition, ZodObject<Concrete<Defaults>>>(this.nodeType, this.stateDefinition, defaultsSchema);
    }
}

export const defineNode = <
    T extends Capitalize<string>,
    StateDefinition extends ZodObject<any>,
>(nodeType: T, stateDefinition: StateDefinition) => new NodeDefinition(nodeType, stateDefinition);

