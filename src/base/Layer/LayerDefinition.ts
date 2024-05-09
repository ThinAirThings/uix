import { TypeOf, ZodTypeAny } from "zod"
import { ExtendUixError } from "../UixErr"
import { Err, Result } from "@/src/types/Result"
import { UixNode } from "@/src/types/UixNode"
import { CreateNodeFunction, GraphDefinition, GraphDefinitionAny } from "../Graph/GraphDefinition"
import { UixLayerError } from "../LayerError/UixLayerError"
import { NodeDefinition, NodeDefinitionsAny } from "../Node/NodeDefinition"
import { RelationshipDefinition } from "../Relationship/RelationshipDefinition"


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
type MaybeConfigurationArg<T extends ZodTypeAny | undefined> = T extends ZodTypeAny ? [TypeOf<T>] : []
export type MaybeDependenciesArg<T extends Record<string, any> | undefined> = T extends Record<string, any> ? [T] : []
type MaybeErrorType<
    T extends ((...args: any[]) => ReturnType<ReturnType<typeof UixLayerError>>['val']) | undefined
> = T extends ((...args: any[]) => ReturnType<ReturnType<typeof UixLayerError>>['val']) ? ReturnType<T> : ReturnType<ReturnType<typeof UixLayerError>>['val']
export type LayerDefinitionAny = LayerDefinition<any, any, any, any>
//  ___       __ _      _ _   _          
// |   \ ___ / _(_)_ _ (_) |_(_)___ _ _  
// | |) / -_)  _| | ' \| |  _| / _ \ ' \ 
// |___/\___|_| |_|_||_|_|\__|_\___/_||_|                              
export class LayerDefinition<
    // These are your type-level property declarations. Passing these through each time you execute a method
    // is analogous to returning an instance of 'this' at the runtime level.
    LayerType extends Capitalize<string>,
    ConfigurationDefinition extends ZodTypeAny | undefined = undefined,
    Dependencies extends Record<string, any> | undefined = undefined,
    CreateNode extends ((...args: any[]) => Promise<Result<UixNode, any>>) | undefined = undefined,
> {
    //  ___ _        _   _      ___             _   _             
    // / __| |_ __ _| |_(_)__  | __|  _ _ _  __| |_(_)___ _ _  ___
    // \__ \  _/ _` |  _| / _| | _| || | ' \/ _|  _| / _ \ ' \(_-<
    // |___/\__\__,_|\__|_\__| |_| \_,_|_||_\__|\__|_\___/_||_/__/
    static define = <
        LayerType extends Capitalize<string>
    >(layerType: LayerType) => new LayerDefinition(layerType)
    // This constructs the result of what you've defined while using the methods to define your layer type.
    private compose = <
        CreateNode
    >(
        _createNode: CreateNode
    ) => <
        InputGraph extends GraphDefinitionAny,
    >(
        graph: InputGraph,
        ...[config]: MaybeConfigurationArg<ConfigurationDefinition>
    ) => {
            type TypeArgs = InputGraph extends GraphDefinition<
                infer NodeDefinitions,
                infer RelationshipDefinitions,
                infer CreateNode
            > ? {
                NodeDefinitions: NodeDefinitions,
                RelationshipDefinitions: RelationshipDefinitions,
                CreateNode: CreateNode
            } : never
            // 
            const dependencies = this.initializer(graph, ...config)
            return new GraphDefinition<
                TypeArgs['NodeDefinitions'],
                TypeArgs['RelationshipDefinitions'],
                CreateNodeFunction<
                    TypeArgs['NodeDefinitions'],
                    CreateNode extends ((...args: any[]) => infer R)
                    ? R extends Promise<Result<UixNode, infer ErrorType>>
                    ? (ErrorType | (TypeArgs['CreateNode'] extends ((...args: any[]) => infer R)
                        ? R extends Promise<Result<UixNode, infer ErrorType>>
                        ? ErrorType : never : never))
                    : never
                    : TypeArgs['CreateNode'] extends ((...args: any[]) => infer R)
                    ? R extends Promise<Result<UixNode, infer ErrorType>>
                    ? ErrorType : never
                    : never
                >
            >(
                graph.nodeDefinitions,
                graph.relationshipDefinitions,
                async (
                    nodeType,
                    initialState
                ) => {
                    return this.createNode
                        ? this.createNode(graph, nodeType, initialState, UixLayerError(this.layerType), dependencies)
                        : await graph.createNode(nodeType, initialState)
                }
            )
        }


    //      ___             _               _           
    //     / __|___ _ _  __| |_ _ _ _  _ __| |_ ___ _ _ 
    //    | (__/ _ \ ' \(_-<  _| '_| || / _|  _/ _ \ '_|
    //     \___\___/_||_/__/\__|_|  \_,_\__|\__\___/_|  
    private constructor(
        public layerType: LayerType,
        public configurationDefinition: ConfigurationDefinition = undefined as ConfigurationDefinition,
        private initializer: (
            graph: GraphDefinition<any, any>,
            ...[config]: MaybeConfigurationArg<ConfigurationDefinition>
        ) => Dependencies = (() => ({}) as Dependencies),
        private createNode: CreateNode = undefined as CreateNode
    ) { }

    //  ___      _ _    _            
    // | _ )_  _(_) |__| |___ _ _ ___
    // | _ \ || | | / _` / -_) '_(_-<
    // |___/\_,_|_|_\__,_\___|_| /__/
    defineConfiguration = <
        ConfigurationDefinition extends ZodTypeAny
    >(
        configurationDefinition: ConfigurationDefinition
    ) =>
        // this.wrap(
        new LayerDefinition(
            this.layerType,
            configurationDefinition
        )
    // )
    defineInitializer = <
        Dependencies extends Record<string, any>
    >(
        initializer: (graph: GraphDefinition, ...[config]: MaybeConfigurationArg<ConfigurationDefinition>) => Dependencies
    ) =>
        // this.wrap(
        new LayerDefinition(
            this.layerType,
            this.configurationDefinition,
            initializer
            // )
        )
    defineCreateNode = <
        ErrorType extends ReturnType<ReturnType<typeof UixLayerError>>['val']
    >(createNode: (
        graph: GraphDefinition,
        nodeType: Capitalize<string>,
        initialState: Record<string, any>,
        UixError: ReturnType<typeof UixLayerError<LayerType>>,
        ...[dependencyInjection]: MaybeDependenciesArg<Dependencies>
    ) => Promise<Result<
        UixNode,
        ErrorType
    >>) =>
        // this.wrap(
        new LayerDefinition(
            this.layerType,
            this.configurationDefinition,
            this.initializer,
            createNode
        )
    // )

    //  ___     _          _         _   _ _   _ _ _ _   _        
    // | _ \_ _(_)_ ____ _| |_ ___  | | | | |_(_) (_) |_(_)___ ___
    // |  _/ '_| \ V / _` |  _/ -_) | |_| |  _| | | |  _| / -_|_-<
    // |_| |_| |_|\_/\__,_|\__\___|  \___/ \__|_|_|_|\__|_\___/__/
    private wrap = <
        LayerType extends Capitalize<string>,
        ConfigurationDefinition extends ZodTypeAny | undefined = undefined,
        Dependencies extends Record<string, any> | undefined = undefined,
        CreateNode extends ((...args: any[]) => Promise<Result<UixNode, any>>) | undefined = undefined,
    >(definition: LayerDefinition<LayerType, ConfigurationDefinition, Dependencies, CreateNode>) => Object.assign(this.compose(definition.createNode), {
        ...definition
    })
}