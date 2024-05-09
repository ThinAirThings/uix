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

//  ___       __ _      _ _   _          
// |   \ ___ / _(_)_ _ (_) |_(_)___ _ _  
// | |) / -_)  _| | ' \| |  _| / _ \ ' \ 
// |___/\___|_| |_|_||_|_|\__|_\___/_||_|                              
export class LayerComposition<
    // These are your type-level property declarations. Passing these through each time you execute a method
    // is analogous to returning an instance of 'this' at the runtime level.
    LayerType extends Capitalize<string>,
    ConfigurationDefinition extends ZodTypeAny | undefined = undefined,
    Initializer extends InitializerArg<ConfigurationDefinition> = undefined,
// CreateNode extends ((...args: any[]) => Promise<Result<UixNode, any>>) | undefined = undefined,
> {
    //  ___ _        _   _      ___             _   _             
    // / __| |_ __ _| |_(_)__  | __|  _ _ _  __| |_(_)___ _ _  ___
    // \__ \  _/ _` |  _| / _| | _| || | ' \/ _|  _| / _ \ ' \(_-<
    // |___/\__\__,_|\__|_\__| |_| \_,_|_||_\__|\__|_\___/_||_/__/
    static define = <
        LayerType extends Capitalize<string>
    >(layerType: LayerType) => new LayerDefinition(layerType)

    //      ___             _               _           
    //     / __|___ _ _  __| |_ _ _ _  _ __| |_ ___ _ _ 
    //    | (__/ _ \ ' \(_-<  _| '_| || / _|  _/ _ \ '_|
    //     \___\___/_||_/__/\__|_|  \_,_\__|\__\___/_|  
    private constructor(
        public layerType: LayerType,
        public configurationDefinition: ConfigurationDefinition = undefined as ConfigurationDefinition,
        private initializer: Initializer = undefined as Initializer,
        // private createNode: CreateNode = undefined as CreateNode
    ) { }

    //  ___      _ _    _            
    // | _ )_  _(_) |__| |___ _ _ ___
    // | _ \ || | | / _` / -_) '_(_-<
    // |___/\_,_|_|_\__,_\___|_| /__/
    defineConfiguration = <
        ConfigurationDefinition extends ZodTypeAny
    >(
        configurationDefinition: ConfigurationDefinition
    ) => new LayerDefinition(
        this.layerType,
        configurationDefinition
    )
    defineInitializer = <
        Initializer extends InitializerArg<ConfigurationDefinition>
    >(
        initializer: Initializer
    ) => new LayerDefinition(
        this.layerType,
        this.configurationDefinition,
        initializer
    )
    // defineCreateNode = <
    //     ErrorType extends ReturnType<ReturnType<typeof UixLayerError>>['val']
    // >(createNode: (
    //     graph: GraphDefinition,
    //     nodeType: Capitalize<string>,
    //     initialState: Record<string, any>,
    //     UixError: ReturnType<typeof UixLayerError<LayerType>>,
    //     ...[dependencyInjection]: MaybeDependenciesArg<Initializer>
    // ) => Promise<Result<
    //     UixNode,
    //     ErrorType
    // >>) => new LayerDefinition(
    //     this.layerType,
    //     this.configurationDefinition,
    //     this.initializer,
    //     createNode
    // )

    //  ___     _          _         _   _ _   _ _ _ _   _        
    // | _ \_ _(_)_ ____ _| |_ ___  | | | | |_(_) (_) |_(_)___ ___
    // |  _/ '_| \ V / _` |  _/ -_) | |_| |  _| | | |  _| / -_|_-<
    // |_| |_| |_|\_/\__,_|\__\___|  \___/ \__|_|_|_|\__|_\___/__/
    // private wrap = <
    //     LayerType extends Capitalize<string>,
    //     ConfigurationDefinition extends ZodTypeAny | undefined = undefined,
    //     Initializer extends InitializerArg<ConfigurationDefinition> = undefined,
    //     CreateNode extends ((...args: any[]) => Promise<Result<UixNode, any>>) | undefined = undefined,
    // >(definition: LayerDefinition<LayerType, ConfigurationDefinition, Dependencies, CreateNode>) => Object.assign(this.compose(definition.createNode), {
    //     ...definition
    // })
    // This constructs the result of what you've defined while using the methods to define your layer type.
    // private compose = <
    //     CreateNode
    // >(
    //     _createNode: CreateNode
    // ) => <
    //     InputGraph extends GraphDefinitionAny,
    // >(
    //     graph: InputGraph,
    //     ...[config]: MaybeConfigurationArg<ConfigurationDefinition>
    // ) => {
    //         type TypeArgs = InputGraph extends GraphDefinition<
    //             infer NodeDefinitions,
    //             infer RelationshipDefinitions,
    //             infer CreateNode
    //         > ? {
    //             NodeDefinitions: NodeDefinitions,
    //             RelationshipDefinitions: RelationshipDefinitions,
    //             CreateNode: CreateNode
    //         } : never
    //         // 
    //         const dependencies = this.initializer?.(graph, ...config)
    //         return new GraphDefinition<
    //             TypeArgs['NodeDefinitions'],
    //             TypeArgs['RelationshipDefinitions'],
    //             CreateNodeFunction<
    //                 TypeArgs['NodeDefinitions'],
    //                 CreateNode extends ((...args: any[]) => infer R)
    //                 ? R extends Promise<Result<UixNode, infer ErrorType>>
    //                 ? (ErrorType | (TypeArgs['CreateNode'] extends ((...args: any[]) => infer R)
    //                     ? R extends Promise<Result<UixNode, infer ErrorType>>
    //                     ? ErrorType : never : never))
    //                 : never
    //                 : TypeArgs['CreateNode'] extends ((...args: any[]) => infer R)
    //                 ? R extends Promise<Result<UixNode, infer ErrorType>>
    //                 ? ErrorType : never
    //                 : never
    //             >
    //         >(
    //             graph.nodeDefinitions,
    //             graph.relationshipDefinitions,
    //             async (
    //                 nodeType,
    //                 initialState
    //             ) => {
    //                 return this.createNode
    //                     ? this.createNode(graph, nodeType, initialState, UixLayerError(this.layerType), dependencies)
    //                     : await graph.createNode(nodeType, initialState)
    //             }
    //         )
    //     }
}