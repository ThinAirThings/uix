import { TypeOf, ZodTypeAny } from "zod"
import { GraphDefinition } from "../Graph/GraphType"


//  _  _     _          
// | \| |___| |_ ___ ___
// | .` / _ \  _/ -_|_-<
// |_|\_\___/\__\___/__/
/* 
    - The LayerDefinition is completely independent of the GraphDefinition type.
        -- Because of this, all of the implementation details for layer methods
        should be written within the context of supertypes like ZodTypeAny, Record<string, any>, etc.
        -- There is a layering going on here where supertypes and subtypes distinctions are being interwoven 
        such that depending on the contextual level of what's being defined, you're either thinking
        in terms of supertypes, or subtypes. For example, you define the methods such as 'createNode',
        'updateNode', etc. in terms of supertypes, however, the build function will return these functions
        constrained to the subtypes defined by the GraphDefinition type which is passed in.
        -- Many of the issues you've run into in the past have been due to constraining supertype level
        definitions with subtypes that are independent from the implementation of the supertype methods.
*/


//  _   _ _   _ _ _ _          _____                  
// | | | | |_(_) (_) |_ _  _  |_   _|  _ _ __  ___ ___
// | |_| |  _| | | |  _| || |   | || || | '_ \/ -_|_-<
//  \___/ \__|_|_|_|\__|\_, |   |_| \_, | .__/\___/__/
//                      |__/        |__/|_|           
type MaybeConfigurationArg<T> = T extends ZodTypeAny ? [TypeOf<T>] : []
export type InitializerArg<ConfigurationDefinition> = ((graph: GraphDefinition, ...[config]: MaybeConfigurationArg<ConfigurationDefinition>) => Record<string, any> | undefined) | undefined
export type MaybeDependenciesArg<T> = T extends (...args: any[]) => infer R
    ? R extends Record<string, any> ? [R] : [] : []

export type LayerConfigurationAny = LayerConfiguration<any, any, any>
//  ___       __ _      _ _   _          
// |   \ ___ / _(_)_ _ (_) |_(_)___ _ _  
// | |) / -_)  _| | ' \| |  _| / _ \ ' \ 
// |___/\___|_| |_|_||_|_|\__|_\___/_||_|                              
export class LayerConfiguration<
    // These are your type-level property declarations. Passing these through each time you execute a method
    // is analogous to returning an instance of 'this' at the runtime level.
    LayerType extends Capitalize<string>,
    ConfigurationDefinition extends ZodTypeAny | undefined = undefined,
    Initializer extends InitializerArg<ConfigurationDefinition> = undefined,
> {
    //  ___ _        _   _      ___             _   _             
    // / __| |_ __ _| |_(_)__  | __|  _ _ _  __| |_(_)___ _ _  ___
    // \__ \  _/ _` |  _| / _| | _| || | ' \/ _|  _| / _ \ ' \(_-<
    // |___/\__\__,_|\__|_\__| |_| \_,_|_||_\__|\__|_\___/_||_/__/
    static define = <
        LayerType extends Capitalize<string>
    >(layerType: LayerType) => new LayerConfiguration(layerType)

    //      ___             _               _           
    //     / __|___ _ _  __| |_ _ _ _  _ __| |_ ___ _ _ 
    //    | (__/ _ \ ' \(_-<  _| '_| || / _|  _/ _ \ '_|
    //     \___\___/_||_/__/\__|_|  \_,_\__|\__\___/_|  
    private constructor(
        public layerType: LayerType,
        public configurationDefinition: ConfigurationDefinition = undefined as ConfigurationDefinition,
        public initializer: Initializer = undefined as Initializer,
    ) { }
    //  ___      _ _    _            
    // | _ )_  _(_) |__| |___ _ _ ___
    // | _ \ || | | / _` / -_) '_(_-<
    // |___/\_,_|_|_\__,_\___|_| /__/
    defineConfiguration = <
        ConfigurationDefinition extends ZodTypeAny
    >(
        configurationDefinition: ConfigurationDefinition
    ) => new LayerConfiguration(
        this.layerType,
        configurationDefinition,
    )
    defineInitializer = <
        Initializer extends InitializerArg<ConfigurationDefinition>
    >(
        initializer: Initializer
    ) => new LayerConfiguration(
        this.layerType,
        this.configurationDefinition,
        initializer
    )
}