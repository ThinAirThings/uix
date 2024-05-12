import { TypeOf, ZodObject, ZodOptional, ZodTypeAny, z } from "zod";


//  _   _ _   _ _ _ _          _____                  
// | | | | |_(_) (_) |_ _  _  |_   _|  _ _ __  ___ ___
// | |_| |  _| | | |  _| || |   | || || | '_ \/ -_|_-<
//  \___/ \__|_|_|_|\__|\_, |   |_| \_, | .__/\___/__/
//                      |__/        |__/|_|           

type UnwrapZodOptional<T extends ZodTypeAny> = T extends ZodOptional<infer U> ? U : T;

type Concrete<T extends Record<string, any>> = {
    [P in keyof T]: NonNullable<T[P]>;
};

export type AnyNodeType = NodeType<any, any, any, any>
export type GenericNodeType = NodeType<
    Capitalize<string>,
    ZodObject<any>,
    ZodObject<any>,
    ['nodeId', ...readonly Capitalize<string>[]]
>
//  ___       __ _      _ _   _          
// |   \ ___ / _(_)_ _ (_) |_(_)___ _ _  
// | |) / -_)  _| | ' \| |  _| / _ \ ' \ 
// |___/\___|_| |_|_||_|_|\__|_\___/_||_| 
export class NodeType<
    Type extends Capitalize<string> = Capitalize<string>,
    StateSchema extends ZodObject<any> = ZodObject<any>,
    StateDefaultSchema extends ZodObject<any> = ZodObject<any>,
    UniqueIndexes extends (readonly (keyof TypeOf<StateSchema> | 'nodeId')[]) | ['nodeId'] = ['nodeId']
> {
    //  ___ _        _   _      ___             _   _             
    // / __| |_ __ _| |_(_)__  | __|  _ _ _  __| |_(_)___ _ _  ___
    // \__ \  _/ _` |  _| / _| | _| || | ' \/ _|  _| / _ \ ' \(_-<
    // |___/\__\__,_|\__|_\__| |_| \_,_|_||_\__|\__|_\___/_||_/__/
    static define = <
        Type extends Capitalize<string>,
        StateSchema extends ZodObject<any>,
    >(type: Type, stateSchema: StateSchema) => new NodeType(type, stateSchema);
    //      ___             _               _           
    //     / __|___ _ _  __| |_ _ _ _  _ __| |_ ___ _ _ 
    //    | (__/ _ \ ' \(_-<  _| '_| || / _|  _/ _ \ '_|
    //     \___\___/_||_/__/\__|_|  \_,_\__|\__\___/_|  
    private constructor(
        public type: Type,
        public stateSchema: StateSchema,
        public stateDefaultSchema: StateDefaultSchema = z.object({}) as StateDefaultSchema,
        public uniqueIndexes: UniqueIndexes = ['nodeId'] as UniqueIndexes
    ) { }
    //  ___      _ _    _            
    // | _ )_  _(_) |__| |___ _ _ ___
    // | _ \ || | | / _` / -_) '_(_-<
    // |___/\_,_|_|_\__,_\___|_| /__/
    defineDefaults<Defaults extends { [K in keyof TypeOf<StateSchema>]?: TypeOf<StateSchema>[K] }>(
        defaults: Defaults
    ) {
        const defaultSchema = Object.keys(defaults).reduce((acc, key) => acc.extend({
            [key]: this.stateSchema.shape[key as keyof TypeOf<StateSchema>].default(defaults[key as keyof Defaults])
        }), z.object({})) as ZodObject<{
            [K in keyof Defaults]: UnwrapZodOptional<StateSchema['shape'][K]>
        }>;
        return new NodeType(
            this.type,
            this.stateSchema,
            defaultSchema,
            this.uniqueIndexes
        );
    }
    // Note, you could change this to 'uniqueIndex' and declare these 1 by 1. This would allow you to easily constrain duplicates
    defineUniqueIndexes<UniqueIndexes extends readonly (keyof TypeOf<StateSchema>)[]>(
        indexes: UniqueIndexes
    ) {
        return new NodeType(
            this.type,
            this.stateSchema,
            this.stateDefaultSchema,
            [...indexes, 'nodeId']
        );
    }
}