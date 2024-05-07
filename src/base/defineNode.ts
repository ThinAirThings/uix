import { TypeOf, ZodDefault, ZodObject, ZodOptional, ZodTypeAny, z } from "zod";


type UnwrapZodOptional<T extends ZodTypeAny> = T extends ZodOptional<infer U> ? U : T;

type Concrete<T extends Record<string, any>> = {
    [P in keyof T]: NonNullable<T[P]>;
};

export class NodeDefinition<
    T extends Capitalize<string>,
    StateDefinition extends ZodObject<any>,
    StateDefaults extends ZodObject<any> = ZodObject<{}>,
    UniqueIndexes extends (readonly (keyof TypeOf<StateDefinition> | 'nodeId')[]) | ['nodeId'] = ['nodeId']
> {
    nodeType: T;
    stateDefinition: StateDefinition;
    _stateDefaults: StateDefaults;
    _uniqueIndexes: UniqueIndexes;
    constructor(nodeType: T, stateDefinition: StateDefinition, options?: {
        stateDefaults?: StateDefaults
        uniqueIndexes?: UniqueIndexes
    }) {
        this.nodeType = nodeType;
        this.stateDefinition = stateDefinition;
        this._stateDefaults = options?.stateDefaults ?? z.object({}) as StateDefaults;
        this._uniqueIndexes = options?.uniqueIndexes ?? ['nodeId'] as UniqueIndexes;
    }

    defaults<Defaults extends { [K in keyof TypeOf<StateDefinition>]?: TypeOf<StateDefinition>[K] }>(
        defaults: Defaults
    ): NodeDefinition<T, StateDefinition, ZodObject<{
        [K in keyof Defaults]: UnwrapZodOptional<StateDefinition['shape'][K]>
    }>, UniqueIndexes> {
        const defaultsDefinition = Object.entries(this.stateDefinition.shape).reduce((acc, [key, value]) => ({
            ...acc,
            [key]: (value as any).default(defaults[key])
        }), {});
        const defaultsSchema = z.object(defaultsDefinition as any) as ZodObject<Concrete<Defaults>>;
        return new NodeDefinition(this.nodeType, this.stateDefinition, {
            stateDefaults: defaultsSchema as any,
            uniqueIndexes: this._uniqueIndexes
        });
    }
    uniqueIndexes<UniqueIndexes extends readonly (keyof TypeOf<StateDefinition>)[]>(
        indexes: UniqueIndexes
    ): NodeDefinition<T, StateDefinition, StateDefaults, (UniqueIndexes[number] | 'nodeId')[]> {
        return new NodeDefinition(
            this.nodeType, 
            this.stateDefinition, {
                stateDefaults: this._stateDefaults,
                uniqueIndexes: [...indexes, 'nodeId']
            }
        );
    }
}

export const defineNode = <
    T extends Capitalize<string>,
    StateDefinition extends ZodObject<any>,
>(nodeType: T, stateDefinition: StateDefinition) => new NodeDefinition(nodeType, stateDefinition);


