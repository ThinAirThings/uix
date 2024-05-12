import { Ok } from "@/src/types/Result";
import { GenericCreateNodeInterface } from "../FunctionInterfaces/CreateNodeInterface/CreateNodeInterface";
import { GraphDefinition as GraphDefinitionDefault, GraphDefinitionAny } from "../Graph/GraphDefinition";
import { v4 as uuidv4 } from 'uuid'
import { DependenciesDefinitionAny, PossibleConfiguration } from "../Dependencies/DependenciesDefinition";
import { FunctionInterfaceDefinition, FunctionInterfaceDefinitionAny, GenericFunctionImplementation, GenericFunctionImplementationAny, UnimplementedFunctionInterfaceDefinitionAny } from "../FunctionInterfaces/FunctionInterfaceDefinition";


//  _   _ _   _ _ _ _          _____                  
// | | | | |_(_) (_) |_ _  _  |_   _|  _ _ __  ___ ___
// | |_| |  _| | | |  _| || |   | || || | '_ \/ -_|_-<
//  \___/ \__|_|_|_|\__|\_, |   |_| \_, | .__/\___/__/
//                      |__/        |__/|_|  
export type SystemDefinitionAny = SystemDefinition<any, any, any>
type PossibleDependenciesDefinition<T> = T extends DependenciesDefinitionAny ? T : never
type PossibleSubSystem<T> = T extends SystemDefinitionAny ? [T] : []
export type FunctionInterfaceDefinitionsDefault = readonly FunctionInterfaceDefinition[]
export type FunctionInterfaceDefinitionsAny = readonly FunctionInterfaceDefinitionAny[]
export type UnimplementedFunctionInterfaceDefinitionsAny = readonly UnimplementedFunctionInterfaceDefinitionAny[]
//  ___       __ _      _ _   _          
// |   \ ___ / _(_)_ _ (_) |_(_)___ _ _  
// | |) / -_)  _| | ' \| |  _| / _ \ ' \ 
// |___/\___|_| |_|_||_|_|\__|_\___/_||_| 
export class SystemDefinition<
    SystemType extends Capitalize<string> = Capitalize<string>,
    FunctionInterfaceDefinitions extends FunctionInterfaceDefinitionsAny = FunctionInterfaceDefinitionsDefault,
    DependenciesDefinition extends DependenciesDefinitionAny | undefined = undefined,
> {
    static define = <
        SystemType extends Capitalize<string>,
        UnimplementedFunctionInterfaceDefinitions extends UnimplementedFunctionInterfaceDefinitionsAny,
    >(
        systemType: SystemType,
        unimplementedFunctionInterfaceDefinitions: UnimplementedFunctionInterfaceDefinitions
    ) => new SystemDefinition(
        systemType,
        unimplementedFunctionInterfaceDefinitions,
    )
    private constructor(
        public systemType: SystemType,
        public functionInterfaceDefinitions: FunctionInterfaceDefinitions,
        public dependenciesDefinition: DependenciesDefinition = undefined as DependenciesDefinition,
    ) { }
    defineDependencies<
        DependenciesDefinition extends DependenciesDefinitionAny
    >(
        dependenciesDefinition: DependenciesDefinition
    ) {
        return new SystemDefinition(
            this.systemType,
            this.functionInterfaceDefinitions,
            dependenciesDefinition
        )
    }
    defineImplementations<
        FunctionInterfaceImplementations extends readonly {
            [FunctionType in FunctionInterfaceDefinitions[number]['functionType']]: (FunctionInterfaceDefinitions[number] & { functionType: FunctionType }) extends FunctionInterfaceDefinition<
                // This is effectively an object deconstruction for a type. This is much more algorithmically efficient than using [number] on every entry.
                // You can use this paradigm to avoid refactoring to mapped typed and stick with the set/tuple approach without taking a performance hit.
                infer FunctionType, infer InputSchema, infer SuccessSchema, infer ErrorSchema, infer InterfaceFactory>
            ? FunctionInterfaceDefinition<FunctionType, InputSchema, SuccessSchema, ErrorSchema, InterfaceFactory, GenericFunctionImplementation<
                InputSchema, SuccessSchema, ErrorSchema, DependenciesDefinition, any
            >,
                DependenciesDefinition
            > : never
        }[FunctionInterfaceDefinitions[number]['functionType']][]
    >(
        functionInterfaceImplementations: FunctionInterfaceImplementations
    ) {
        return new SystemDefinition(
            this.systemType,
            functionInterfaceImplementations,
            this.dependenciesDefinition
        )
    }
}


