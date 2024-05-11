import { TypeOf, ZodObject, ZodTuple } from "zod";
import { DependenciesDefinitionAny, PossibleDependencies } from "../Dependencies/DependenciesDefinition";
import { GraphDefinitionAny } from "../Graph/GraphDefinition";
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
    DependenciesDefinition extends DependenciesDefinitionAny | undefined
> = (
    graphDefinition: GraphDefinitionAny,
    subsystem: SystemAny,
    ...input: [...TypeOf<InputSchema>, ...PossibleDependencies<DependenciesDefinition>]
) => Promise<Result<
    TypeOf<SuccessSchema>,
    TypeOf<ErrorSchema>
>>
export type FunctionInterfaceAny = FunctionInterface<any, any, any, any>
export type DefinedFunctionInterface = ReturnType<typeof FunctionInterface['define']>
//  ___       __ _      _ _   _          
// |   \ ___ / _(_)_ _ (_) |_(_)___ _ _  
// | |) / -_)  _| | ' \| |  _| / _ \ ' \ 
// |___/\___|_| |_|_||_|_|\__|_\___/_||_| 
export class FunctionInterface<
    FunctionType extends Capitalize<string> = Capitalize<string>,
    InputSchema extends ZodTuple = ZodTuple,
    SuccessSchema extends ZodObject<any> = ZodObject<any>,
    ErrorSchema extends ZodObject<any> = ZodObject<any>,
    GenericInterfaceFactory extends ((
        graphDefinition: GraphDefinitionAny,
        subsystem: SystemAny,
        implementation: GenericFunctionImplementation<any, any, any, any>
    ) => (...input: TypeOf<InputSchema>) => Promise<Result<
        TypeOf<SuccessSchema>,
        TypeOf<ErrorSchema>
    >>) | undefined = undefined,
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
        public genericInterfaceFactory: GenericInterfaceFactory = undefined as GenericInterfaceFactory,
        public dependenciesDefinition: DependenciesDefinition = undefined as DependenciesDefinition,
        public implementation: GenericFunctionImplementation<InputSchema, SuccessSchema, ErrorSchema, DependenciesDefinition> | undefined = undefined
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
    ) => new FunctionInterface(
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
            implementation: GenericFunctionImplementation<any, any, any, any>
        ) => (...input: TypeOf<InputSchema>) => Promise<Result<
            TypeOf<SuccessSchema>,
            TypeOf<ErrorSchema>
        >>)
    >(
        genericInterfaceFactory: GenericInterfaceFactory
    ) => new FunctionInterface(
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
    ) => new FunctionInterface(
        this.functionType,
        this.inputSchema,
        this.successSchema,
        this.errorSchema,
        this.genericInterfaceFactory,
        dependenciesDefinition
    )
    defineImplementation(
        implementation: GenericFunctionImplementation<InputSchema, SuccessSchema, ErrorSchema, DependenciesDefinition>
    ) {
        return new FunctionInterface(
            this.functionType,
            this.inputSchema,
            this.successSchema,
            this.errorSchema,
            this.genericInterfaceFactory,
            this.dependenciesDefinition,
            implementation
        )
    }

}