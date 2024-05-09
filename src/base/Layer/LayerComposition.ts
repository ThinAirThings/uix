import { TypeOf, ZodTypeAny } from "zod"
import { ExtendUixError } from "../UixErr"
import { Err, Result } from "@/src/types/Result"
import { UixNode } from "@/src/types/UixNode"
import { CreateNodeFunction, GraphDefinition, GraphDefinitionAny } from "../Graph/GraphDefinition"
import { UixLayerError } from "../LayerError/UixLayerError"
import { NodeDefinition, NodeDefinitionsAny } from "../Node/NodeDefinition"
import { RelationshipDefinition, RelationshipDefinitionsAny } from "../Relationship/RelationshipDefinition"


//  _  _     _          
// | \| |___| |_ ___ ___
// | .` / _ \  _/ -_|_-<
// |_|\_\___/\__\___/__/

//  ___       __ _      _ _   _          
// |   \ ___ / _(_)_ _ (_) |_(_)___ _ _  
// | |) / -_)  _| | ' \| |  _| / _ \ ' \ 
// |___/\___|_| |_|_||_|_|\__|_\___/_||_|                              
export class LayerComposition<
    NodeDefinitions extends NodeDefinitionsAny,
    RelationshipDefinitions extends RelationshipDefinitionsAny,
> {
    //  ___ _        _   _      ___             _   _             
    // / __| |_ __ _| |_(_)__  | __|  _ _ _  __| |_(_)___ _ _  ___
    // \__ \  _/ _` |  _| / _| | _| || | ' \/ _|  _| / _ \ ' \(_-<
    // |___/\__\__,_|\__|_\__| |_| \_,_|_||_\__|\__|_\___/_||_/__/
    static compose = <
        NodeDefinitions extends NodeDefinitionsAny,
        RelationshipDefinitions extends RelationshipDefinitionsAny,
    >(
        graphDefinition: GraphDefinition<NodeDefinitions, RelationshipDefinitions>
    ) => new LayerComposition(
        graphDefinition.nodeDefinitions,
        graphDefinition.relationshipDefinitions
    )

    //      ___             _               _           
    //     / __|___ _ _  __| |_ _ _ _  _ __| |_ ___ _ _ 
    //    | (__/ _ \ ' \(_-<  _| '_| || / _|  _/ _ \ '_|
    //     \___\___/_||_/__/\__|_|  \_,_\__|\__\___/_|  
    private constructor(
        public nodeDefinitions: NodeDefinitions,
        public relationshipDefinitions: RelationshipDefinitions
        // private createNode: CreateNode = undefined as CreateNode
    ) { }

    //  ___      _ _    _            
    // | _ )_  _(_) |__| |___ _ _ ___
    // | _ \ || | | / _` / -_) '_(_-<
    // |___/\_,_|_|_\__,_\___|_| /__/





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