
import { TypeOf, ZodTypeAny } from "zod"
import { GraphDefinition } from "../Graph/GraphType"


//  _   _ _   _ _ _ _          _____                  
// | | | | |_(_) (_) |_ _  _  |_   _|  _ _ __  ___ ___
// | |_| |  _| | | |  _| || |   | || || | '_ \/ -_|_-<
//  \___/ \__|_|_|_|\__|\_, |   |_| \_, | .__/\___/__/
//                      |__/        |__/|_|           
export type PossibleConfiguration<T> = T extends ZodTypeAny ? [TypeOf<T>] : []
export type GenericInitializer<ConfigurationDefinition> = ((graph: GraphDefinition, ...[config]: PossibleConfiguration<ConfigurationDefinition>) => Record<string, any> | undefined)
export type DependenciesDefinitionAny = DependenciesDefinition<any, any, any>
export type PossibleDependencies<T> = T extends DependenciesDefinitionAny
    ? T['initializer'] extends (...args: any[]) => infer R
    ? R extends Record<string, any> ? [R] : [] : [] : []
//  ___       __ _      _ _   _          
// |   \ ___ / _(_)_ _ (_) |_(_)___ _ _  
// | |) / -_)  _| | ' \| |  _| / _ \ ' \ 
// |___/\___|_| |_|_||_|_|\__|_\___/_||_|                              
export class DependenciesDefinition<
    DependenciesType extends Capitalize<string> = Capitalize<string>,
    ConfigurationDefinition extends ZodTypeAny | undefined = undefined,
    Initializer extends GenericInitializer<ConfigurationDefinition> | undefined = undefined,
> {
    //  ___ _        _   _      ___             _   _             
    // / __| |_ __ _| |_(_)__  | __|  _ _ _  __| |_(_)___ _ _  ___
    // \__ \  _/ _` |  _| / _| | _| || | ' \/ _|  _| / _ \ ' \(_-<
    // |___/\__\__,_|\__|_\__| |_| \_,_|_||_\__|\__|_\___/_||_/__/
    static define = <
        DependenciesType extends Capitalize<string>
    >(dependenciesType: DependenciesType) => new DependenciesDefinition(dependenciesType)

    //      ___             _               _           
    //     / __|___ _ _  __| |_ _ _ _  _ __| |_ ___ _ _ 
    //    | (__/ _ \ ' \(_-<  _| '_| || / _|  _/ _ \ '_|
    //     \___\___/_||_/__/\__|_|  \_,_\__|\__\___/_|  
    private constructor(
        public dependenciesType: DependenciesType,
        public configurationDefinition: ConfigurationDefinition = undefined as ConfigurationDefinition,
        public initializer: Initializer = undefined as Initializer,
    ) { }
    //  ___      _ _    _            
    // | _ )_  _(_) |__| |___ _ _ ___
    // | _ \ || | | / _` / -_) '_(_-<
    // |___/\_,_|_|_\__,_\___|_| /__/
    defineConfiguration = <
        ConfigurationDefinition extends ZodTypeAny
    >(
        configurationDefinition: ConfigurationDefinition
    ) => new DependenciesDefinition(
        this.dependenciesType,
        configurationDefinition,
    )
    defineInitializer = <
        Initializer extends GenericInitializer<ConfigurationDefinition>
    >(
        initializer: Initializer
    ) => new DependenciesDefinition(
        this.dependenciesType,
        this.configurationDefinition,
        initializer
    )
}





