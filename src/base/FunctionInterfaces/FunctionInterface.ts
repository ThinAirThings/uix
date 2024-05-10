import { TypeOf, ZodObject, ZodTuple } from "zod";
import { DependenciesDefinition as DefaultDependenciesDefinition, DependenciesDefinitionAny } from "../Dependencies/DependenciesDefinition";
import { GraphDefinitionAny } from "../Graph/GraphDefinition";
import { Result } from "@/src/types/Result";


//  _   _ _   _ _ _ _          _____                  
// | | | | |_(_) (_) |_ _  _  |_   _|  _ _ __  ___ ___
// | |_| |  _| | | |  _| || |   | || || | '_ \/ -_|_-<
//  \___/ \__|_|_|_|\__|\_, |   |_| \_, | .__/\___/__/
//                      |__/        |__/|_|  
type PossibleDependencies<T> = T extends Record<string, any>
    ? [T]
    : []

//  ___       __ _      _ _   _          
// |   \ ___ / _(_)_ _ (_) |_(_)___ _ _  
// | |) / -_)  _| | ' \| |  _| / _ \ ' \ 
// |___/\___|_| |_|_||_|_|\__|_\___/_||_| 
export class FunctionInterface<
    FunctionType extends Capitalize<string>,
    InputSchema extends ZodTuple,
    SuccessSchema extends ZodObject<any>,
    ErrorSchema extends ZodObject<any>,
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
    ) { }
    //  ___ _        _   _      ___             _   _             
    // / __| |_ __ _| |_(_)__  | __|  _ _ _  __| |_(_)___ _ _  ___
    // \__ \  _/ _` |  _| / _| | _| || | ' \/ _|  _| / _ \ ' \(_-<
    // |___/\__\__,_|\__|_\__| |_| \_,_|_||_\__|\__|_\___/_||_/__/
    static define = <
        FunctionType extends Capitalize<string>,
        InputSchema extends ZodTuple,
        SuccessSchema extends ZodObject<any>,
        ErrorSchema extends ZodObject<any>,
    >(
        functionType: FunctionType, schema: {
            input: InputSchema,
            success: SuccessSchema,
            error: ErrorSchema
        }
    ) => class DefinedFunctionInterface<
        GenericInterface extends (...args: TypeOf<InputSchema>) => any = (...args: TypeOf<InputSchema>) => any,
        DependenciesDefinition extends DependenciesDefinitionAny = DefaultDependenciesDefinition,
    > extends FunctionInterface<
        FunctionType,
        InputSchema,
        SuccessSchema,
        ErrorSchema
    > {
            private constructor(
                public dependenciesDefinition: DependenciesDefinition,
                public implementation: ((
                    graphDefinition: GraphDefinitionAny,
                    ...input: [...TypeOf<InputSchema>, ...PossibleDependencies<ReturnType<DependenciesDefinition['initializer']>>]
                ) => Promise<Result<
                    TypeOf<SuccessSchema>,
                    TypeOf<ErrorSchema>
                >>) | undefined = undefined
            ) {
                super(
                    functionType,
                    schema.input,
                    schema.success,
                    schema.error
                )
            }
            //  ___      _ _    _            
            // | _ )_  _(_) |__| |___ _ _ ___
            // | _ \ || | | / _` / -_) '_(_-<
            // |___/\_,_|_|_\__,_\___|_| /__/
            static defineDependencies = <
                DependenciesDefinition extends DependenciesDefinitionAny
            >(
                dependenciesDefinition: DependenciesDefinition
            ) => new DefinedFunctionInterface(
                dependenciesDefinition
            )
            defineImplementation<
                GenericInterface extends (...args: TypeOf<InputSchema>) => any
            >(
                implementation: typeof this.implementation
            ) {
                return new DefinedFunctionInterface<GenericInterface, any>(
                    this.dependenciesDefinition,
                    implementation as unknown as typeof this.implementation
                )
            }
        }
}