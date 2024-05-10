import { TypeOf, ZodObject, ZodTuple, ZodTypeAny } from "zod";
import { DependenciesDefinition, DependenciesDefinitionAny, GenericInitializer } from "../Dependencies/DependenciesDefinition";
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
export class FunctionDefinition<
    FunctionType extends Capitalize<string>,
    InputSchema extends ZodTuple<any>,
    SuccessSchema extends ZodObject<any>,
    ErrorSchema extends ZodObject<any>,
    Dependencies extends Record<string, any> | undefined = undefined,
> {
    //  ___ _        _   _      ___             _   _             
    // / __| |_ __ _| |_(_)__  | __|  _ _ _  __| |_(_)___ _ _  ___
    // \__ \  _/ _` |  _| / _| | _| || | ' \/ _|  _| / _ \ ' \(_-<
    // |___/\__\__,_|\__|_\__| |_| \_,_|_||_\__|\__|_\___/_||_/__/
    static constrain = <
        DependenciesDefinition extends DependenciesDefinitionAny
    >(
        _dependenciesDefinition: DependenciesDefinition
    ) => class ConstrainedFunctionDefinition<
        FunctionType extends Capitalize<string>,
        InputSchema extends ZodTuple,
        SuccessSchema extends ZodObject<any>,
        ErrorSchema extends ZodObject<any>,
    > extends FunctionDefinition<
        FunctionType,
        InputSchema,
        SuccessSchema,
        ErrorSchema,
        ReturnType<DependenciesDefinition['initializer']>
    > {
            static define = <
                FunctionType extends Capitalize<string>,
                InputSchema extends ZodTuple,
                SuccessSchema extends ZodObject<any>,
                ErrorSchema extends ZodObject<any>,
            >(
                functionType: FunctionType,
                inputSchema: InputSchema,
                successSchema: SuccessSchema,
                errorSchema: ErrorSchema
            ) => new ConstrainedFunctionDefinition(
                functionType,
                inputSchema,
                successSchema,
                errorSchema
            )
        }
    //      ___             _               _           
    //     / __|___ _ _  __| |_ _ _ _  _ __| |_ ___ _ _ 
    //    | (__/ _ \ ' \(_-<  _| '_| || / _|  _/ _ \ '_|
    //     \___\___/_||_/__/\__|_|  \_,_\__|\__\___/_|  
    private constructor(
        public functionType: FunctionType,
        public inputSchema: InputSchema,
        public successSchema: SuccessSchema,
        public errorSchema: ErrorSchema,
        public implementation: ((
            graphDefinition: GraphDefinitionAny,
            // ...input: TypeOf<InputSchema>
            // ...dependencies: PossibleDependencies<Dependencies>
            ...input: [...TypeOf<InputSchema>, ...PossibleDependencies<Dependencies>]
            // ...[dependencies]: PossibleDependencies<Dependencies>
        ) => Promise<Result<
            TypeOf<SuccessSchema>,
            TypeOf<ErrorSchema>
        >>) | undefined = undefined
    ) { }
    //  ___                       _   _        
    // | _ \_ _ ___ _ __  ___ _ _| |_(_)___ ___
    // |  _/ '_/ _ \ '_ \/ -_) '_|  _| / -_|_-<
    // |_| |_| \___/ .__/\___|_|  \__|_\___/__/
    //             |_|  

    //  ___      _ _    _            
    // | _ )_  _(_) |__| |___ _ _ ___
    // | _ \ || | | / _` / -_) '_(_-<
    // |___/\_,_|_|_\__,_\___|_| /__/
    defineImplementation(
        implementation: typeof this.implementation
    ) {
        return new FunctionDefinition(
            this.functionType,
            this.inputSchema,
            this.successSchema,
            this.errorSchema,
            implementation
        )
    }
}