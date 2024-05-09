import { Result } from "@/src/types/Result";
import { UixNode } from "@/src/types/UixNode";
import { UixLayerError } from "../../LayerError/UixLayerError";
import { GraphDefinitionAny } from "../../Graph/GraphDefinition";
import { InitializerArg, LayerConfiguration, LayerConfigurationAny, MaybeDependenciesArg } from "../../Layer/LayerConfiguration";
import { ZodTypeAny } from "zod";


export class CreateNodeDefinition<
    ErrorType,
> {
    //  ___ _        _   _      ___             _   _             
    // / __| |_ __ _| |_(_)__  | __|  _ _ _  __| |_(_)___ _ _  ___
    // \__ \  _/ _` |  _| / _| | _| || | ' \/ _|  _| / _ \ ' \(_-<
    // |___/\__\__,_|\__|_\__| |_| \_,_|_||_\__|\__|_\___/_||_/__/
    static constrain = <
        LayerType extends Capitalize<string>,
        ConfigurationDefinition extends ZodTypeAny | undefined = undefined,
        Initializer extends InitializerArg<ConfigurationDefinition> | undefined = undefined,
    >(
        _layerDefinition: LayerConfiguration<LayerType, ConfigurationDefinition, Initializer>
    ) => class ConstrainedCreateNodeDefinition<
        ErrorType
    > extends CreateNodeDefinition<
        ErrorType
    > {
            static define = <
                ErrorType extends ReturnType<ReturnType<typeof UixLayerError>>['val']
            >(
                fn: (
                    graph: GraphDefinitionAny,
                    nodeType: Capitalize<string>,
                    initialState: Record<string, any>,
                    UixError: ReturnType<typeof UixLayerError<LayerType>>,
                    ...[dependencyInjection]: MaybeDependenciesArg<Initializer>
                ) => Promise<Result<
                    UixNode,
                    ErrorType
                >>
            ) => new ConstrainedCreateNodeDefinition(fn)
        }
    //      ___             _               _           
    //     / __|___ _ _  __| |_ _ _ _  _ __| |_ ___ _ _ 
    //    | (__/ _ \ ' \(_-<  _| '_| || / _|  _/ _ \ '_|
    //     \___\___/_||_/__/\__|_|  \_,_\__|\__\___/_|  
    private constructor(
        public fn: (
            graph: GraphDefinitionAny,
            nodeType: Capitalize<string>,
            initialState: Record<string, any>,
            UixError: ReturnType<typeof UixLayerError<any>>,
            ...args: any[]
        ) => Promise<Result<
            UixNode,
            ErrorType
        >>
    ) { }
}





// Initializer extends ((graph: GraphDefinition, ...[config]: MaybeConfigurationArg<ConfigurationDefinition>) => Record<string, any> | undefined)