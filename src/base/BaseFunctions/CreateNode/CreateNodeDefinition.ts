import { Result } from "@/src/types/Result";
import { UixNode } from "@/src/types/UixNode";
import { UixLayerError } from "../../LayerError/UixLayerError";
import { GraphDefinitionAny } from "../../Graph/GraphDefinition";
import { LayerDefinition, LayerDefinitionAny, MaybeDependenciesArg } from "../../Layer/LayerDefinition";


export class CreateNodeDefinition<
    // LayerType extends Capitalize<string>,
    ErrorType,
// Dependencies extends Record<string, any> | undefined = undefined,
> {
    //  ___ _        _   _      ___             _   _             
    // / __| |_ __ _| |_(_)__  | __|  _ _ _  __| |_(_)___ _ _  ___
    // \__ \  _/ _` |  _| / _| | _| || | ' \/ _|  _| / _ \ ' \(_-<
    // |___/\__\__,_|\__|_\__| |_| \_,_|_||_\__|\__|_\___/_||_/__/
    static constrain = <
        LayerType extends Capitalize<string>,
        Dependencies extends Record<string, any> | undefined = undefined,
    >(
        _layerDefinition: LayerDefinition<LayerType, any, Dependencies>
    ) => class ConstrainedCreateNodeDefinition<
        ErrorType
    > extends CreateNodeDefinition<
        // LayerType,
        ErrorType
    // Dependencies
    > {
            static define = <
                ErrorType extends ReturnType<ReturnType<typeof UixLayerError>>['val']
            >(
                fn: (
                    graph: GraphDefinitionAny,
                    nodeType: Capitalize<string>,
                    initialState: Record<string, any>,
                    UixError: ReturnType<typeof UixLayerError<LayerType>>,
                    ...[dependencyInjection]: MaybeDependenciesArg<Dependencies>
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
            UixError: ReturnType<typeof UixLayerError<LayerType>>,
            ...args: any[]
        ) => Promise<Result<
            UixNode,
            ErrorType
        >>
    ) { }
}





// Initializer extends ((graph: GraphDefinition, ...[config]: MaybeConfigurationArg<ConfigurationDefinition>) => Record<string, any> | undefined)