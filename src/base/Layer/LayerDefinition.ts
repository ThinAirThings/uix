import { GraphLayer } from "@/src/types/GraphLayer"
import { TypeOf, ZodTypeAny } from "zod"
import { ExtendUixError } from "../UixErr"
import { Result } from "@/src/types/Result"
import { UixNode } from "@/src/types/UixNode"


//  _  _     _          
// | \| |___| |_ ___ ___
// | .` / _ \  _/ -_|_-<
// |_|\_\___/\__\___/__/
/* 
    - The LayerDefinition is completely independent of the GraphLayer type.
        -- Because of this, all of the implementation details for layer methods
        should be written within the context of supertypes like ZodTypeAny, Record<string, any>, etc.
        -- There is a layering going on here where supertypes and subtypes distinctions are being interwoven 
        such that depending on the contextual level of what's being defined, you're either thinking
        in terms of supertypes, or subtypes. For example, you define the methods such as 'createNode',
        'updateNode', etc. in terms of supertypes, however, the build function will return these functions
        constrained to the subtypes defined by the GraphLayer type which is passed in.
        -- Many of the issues you've run into in the past have been due to constraining supertype level
        definitions with subtypes that are independent from the implementation of the supertype methods.
*/


//  _   _ _   _ _ _ _          _____                  
// | | | | |_(_) (_) |_ _  _  |_   _|  _ _ __  ___ ___
// | |_| |  _| | | |  _| || |   | || || | '_ \/ -_|_-<
//  \___/ \__|_|_|_|\__|\_, |   |_| \_, | .__/\___/__/
//                      |__/        |__/|_|           
type MaybeConfigurationArg<T extends ZodTypeAny | undefined> = T extends ZodTypeAny ? [TypeOf<T>] : []

//  ___       __ _      _ _   _          
// |   \ ___ / _(_)_ _ (_) |_(_)___ _ _  
// | |) / -_)  _| | ' \| |  _| / _ \ ' \ 
// |___/\___|_| |_|_||_|_|\__|_\___/_||_|                              

export class LayerDefinition<
    // These are your type-level property declarations. Passing these through each time you execute a method
    // is analogous to returning an instance of 'this' at the runtime level.
    LayerType extends Capitalize<string>,
    ConfigurationDefinition extends ZodTypeAny | undefined = undefined,
    Dependencies extends Record<string, any> | undefined = undefined
> {
    // This constructs the result of what you've defined while using the methods to define your layer type.
    private compose = <G extends GraphLayer>(
        graph: G,
        ...[config]: MaybeConfigurationArg<ConfigurationDefinition>
    ) => {
        const UixErr = ExtendUixError(graph)
        const dependencies = this._initializer(graph, ...config)
        return {
            createNode: async (
                nodeType: Capitalize<string>,
                initialState: Record<string, any>,
                ...[dependencyInjection]: Dependencies extends NonNullable<unknown> ? [Dependencies] : []
            ) => {
                return await this.createNode(graph, UixErr, nodeType, initialState, dependencyInjection)
            }
        }
    }
    private wrap = <
        LayerType extends Capitalize<string>,
        ConfigurationDefinition extends ZodTypeAny | undefined = undefined,
        Dependencies extends Record<string, any> | undefined = undefined
    >(definition: LayerDefinition<LayerType, ConfigurationDefinition, Dependencies>) => Object.assign(this.compose, {
        ...definition
    })
    layerType: LayerType
    configurationDefinition: ConfigurationDefinition
    private _initializer: (graph: GraphLayer, ...[config]: MaybeConfigurationArg<ConfigurationDefinition>) => Dependencies
    constructor(layerType: LayerType, options?: {
        configurationDefinition?: ConfigurationDefinition,
        initializer?: (graph: GraphLayer, ...[config]: MaybeConfigurationArg<ConfigurationDefinition>) => Dependencies,
        // createNode?: (graph: GraphLayer, UixErr: ReturnType<typeof ExtendUixError>, nodeType: Capitalize<string>, initialState: Record<string, any>, ...[dependencyInjection]: Dependencies extends NonNullable<unknown> ? [Dependencies] : []) => Promise<Result<UixNode<any, any>, ReturnType<ReturnType<typeof ExtendUixError>>>
    }) {
        this.layerType = layerType
        this.configurationDefinition = options?.configurationDefinition ?? undefined as ConfigurationDefinition
        this._initializer = options?.initializer ?? (() => ({}) as Dependencies)
    }
    configuration = <
        ConfigurationDefinition extends ZodTypeAny
    >(
        configurationDefinition: ConfigurationDefinition
    ) => this.wrap(new LayerDefinition(this.layerType, {
        configurationDefinition,
    }))
    initializer = <
        Dependencies extends Record<string, any>
    >(
        initializer: (graph: GraphLayer, ...[config]: MaybeConfigurationArg<ConfigurationDefinition>) => Dependencies
    ) => this.wrap(new LayerDefinition(this.layerType, {
        configurationDefinition: this.configurationDefinition,
        initializer
    }))
    createNode = (fn: (
        graph: GraphLayer,
        UixErr: ReturnType<typeof ExtendUixError>,
        nodeType: Capitalize<string>,
        initialState: Record<string, any>,
        ...[dependencyInjection]: Dependencies extends NonNullable<unknown> ? [Dependencies] : []
    ) => Promise<Result<
        UixNode<any, any>,
        ReturnType<ReturnType<typeof ExtendUixError>>
    >>) => this.wrap(new LayerDefinition(this.layerType, {
        configurationDefinition: this.configurationDefinition,
        initializer: this._initializer
    }))
}