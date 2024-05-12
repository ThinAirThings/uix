import { TypeOf, ZodObject, ZodTuple } from "zod";
import { DependenciesDefinitionAny, PossibleDependencies } from "../Dependencies/DependenciesDefinition";
import { GraphDefinitionAny } from "../Graph/GraphType";
import { Result } from "@/src/types/Result";
import { SystemAny } from "../System/System";


//  _   _ _   _ _ _ _          _____                  
// | | | | |_(_) (_) |_ _  _  |_   _|  _ _ __  ___ ___
// | |_| |  _| | | |  _| || |   | || || | '_ \/ -_|_-<
//  \___/ \__|_|_|_|\__|\_, |   |_| \_, | .__/\___/__/
//                      |__/        |__/|_|  


export type GenericFunctionImplementation<
    InputSchema extends ZodTuple,
    SuccessSchema extends ZodObject<any>,
    ErrorSchema extends ZodObject<any>,
    DependenciesDefinition extends DependenciesDefinitionAny | undefined,
    ErrorType extends TypeOf<ErrorSchema>,
> = (
    graphDefinition: GraphDefinitionAny,
    subsystem: SystemAny,
    ...input: [...TypeOf<InputSchema>, ...PossibleDependencies<DependenciesDefinition>]
) => Promise<Result<
    TypeOf<SuccessSchema>,
    ErrorType
>>
export type GenericInterfaceFactory<
    InputSchema extends ZodTuple,
    SuccessSchema extends ZodObject<any>,
    ErrorSchema extends ZodObject<any>,
> = ((
    graphDefinition: GraphDefinitionAny,
    subsystem: SystemAny,
    implementation: GenericFunctionImplementationAny
) => (...input: TypeOf<InputSchema>) => Promise<Result<
    TypeOf<SuccessSchema>,
    TypeOf<ErrorSchema>
>>)

export type GenericFunctionImplementationAny = GenericFunctionImplementation<any, any, any, any, any>
export type UnimplementedFunctionInterfaceDefinitionAny = FunctionInterfaceDefinition<any, any, any, any, any, undefined, undefined>
export type FunctionInterfaceDefinitionAny = FunctionInterfaceDefinition<any, any, any, any, any, any, any>
//  ___       __ _      _ _   _          
// |   \ ___ / _(_)_ _ (_) |_(_)___ _ _  
// | |) / -_)  _| | ' \| |  _| / _ \ ' \ 
// |___/\___|_| |_|_||_|_|\__|_\___/_||_| 
export class FunctionInterfaceDefinition<
    FunctionType extends Capitalize<string> = Capitalize<string>,
    InputSchema extends ZodTuple = ZodTuple,
    SuccessSchema extends ZodObject<any> = ZodObject<any>,
    ErrorSchema extends ZodObject<any> = ZodObject<any>,
    InterfaceFactory extends GenericInterfaceFactory<InputSchema, SuccessSchema, ErrorSchema> | undefined = undefined,
    Implementation extends GenericFunctionImplementationAny | undefined = undefined,
    DependenciesDefinition extends DependenciesDefinitionAny | undefined = undefined,
> {
    //      ___             _               _           
    //     / __|___ _ _  __| |_ _ _ _  _ __| |_ ___ _ _ 
    //    | (__/ _ \ ' \(_-<  _| '_| || / _|  _/ _ \ '_|
    //     \___\___/_||_/__/\__|_|  \_,_\__|\__\___/_|  
    private constructor(
        public functionType: FunctionType,
        public inputSchema: InputSchema,
        public successSchema: SuccessSchema,
        public errorSchema: ErrorSchema,
        public interfaceFactory: InterfaceFactory = undefined as InterfaceFactory,
        public dependenciesDefinition: DependenciesDefinition = undefined as DependenciesDefinition,
        public implementation: Implementation | undefined = undefined
    ) { }
    //  ___ _        _   _      ___             _   _             
    // / __| |_ __ _| |_(_)__  | __|  _ _ _  __| |_(_)___ _ _  ___
    // \__ \  _/ _` |  _| / _| | _| || | ' \/ _|  _| / _ \ ' \(_-<
    // |___/\__\__,_|\__|_\__| |_| \_,_|_||_\__|\__|_\___/_||_/__/
    static define = <
        FunctionType extends Capitalize<string> = Capitalize<string>,
        InputSchema extends ZodTuple = ZodTuple,
        SuccessSchema extends ZodObject<any> = ZodObject<any>,
        ErrorSchema extends ZodObject<any> = ZodObject<any>,
    >(
        functionType: FunctionType, schema: {
            input: InputSchema,
            success: SuccessSchema,
            error: ErrorSchema
        }
    ) => new FunctionInterfaceDefinition(
        functionType,
        schema.input,
        schema.success,
        schema.error
    )

    //  ___      _ _    _            
    // | _ )_  _(_) |__| |___ _ _ ___
    // | _ \ || | | / _` / -_) '_(_-<
    // |___/\_,_|_|_\__,_\___|_| /__/
    defineGenericInterfaceFactory = <
        GenericInterfaceFactory extends ((
            graphDefinition: GraphDefinitionAny,
            subsystem: SystemAny,
            implementation: GenericFunctionImplementationAny
        ) => (...input: TypeOf<InputSchema>) => Promise<Result<
            TypeOf<SuccessSchema>,
            TypeOf<ErrorSchema>
        >>)
    >(
        genericInterfaceFactory: GenericInterfaceFactory
    ) => new FunctionInterfaceDefinition(
        this.functionType,
        this.inputSchema,
        this.successSchema,
        this.errorSchema,
        genericInterfaceFactory
    )
    defineDependencies = <
        DependenciesDefinition extends DependenciesDefinitionAny
    >(
        dependenciesDefinition: DependenciesDefinition
    ) => new FunctionInterfaceDefinition(
        this.functionType,
        this.inputSchema,
        this.successSchema,
        this.errorSchema,
        this.interfaceFactory,
        dependenciesDefinition
    )
    defineImplementation<
        Implementation extends GenericFunctionImplementation<InputSchema, SuccessSchema, ErrorSchema, DependenciesDefinition, any>
    >(
        implementation: Implementation
    ) {
        return new FunctionInterfaceDefinition(
            this.functionType,
            this.inputSchema,
            this.successSchema,
            this.errorSchema,
            this.interfaceFactory,
            this.dependenciesDefinition,
            implementation
        )
    }
}