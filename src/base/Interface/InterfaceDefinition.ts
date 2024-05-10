import { ZodTypeAny } from "zod";
import { DependenciesDefinition, DependenciesDefinitionAny, GenericInitializer } from "../Dependencies/DependenciesDefinition";


//  _   _ _   _ _ _ _          _____                  
// | | | | |_(_) (_) |_ _  _  |_   _|  _ _ __  ___ ___
// | |_| |  _| | | |  _| || |   | || || | '_ \/ -_|_-<
//  \___/ \__|_|_|_|\__|\_, |   |_| \_, | .__/\___/__/
//                      |__/        |__/|_|  


//  ___       __ _      _ _   _          
// |   \ ___ / _(_)_ _ (_) |_(_)___ _ _  
// | |) / -_)  _| | ' \| |  _| / _ \ ' \ 
// |___/\___|_| |_|_||_|_|\__|_\___/_||_| 
export class InterfaceDefinition<
    InterfaceType extends Capitalize<string>,
    Dependencies extends Record<string, any> | undefined = undefined,
> {
    //  ___ _        _   _      ___             _   _             
    // / __| |_ __ _| |_(_)__  | __|  _ _ _  __| |_(_)___ _ _  ___
    // \__ \  _/ _` |  _| / _| | _| || | ' \/ _|  _| / _ \ ' \(_-<
    // |___/\__\__,_|\__|_\__| |_| \_,_|_||_\__|\__|_\___/_||_/__/
    static constrain = <
        DependenciesDefinition extends DependenciesDefinitionAny
    >(
        dependenciesDefinition: DependenciesDefinition
    ) => class ConstrainedInterfaceDefinition<
        InterfaceType extends Capitalize<string>
    > extends InterfaceDefinition<
        InterfaceType,
        ReturnType<DependenciesDefinition['initializer']>
    > {
            static define() { }
        }
    //      ___             _               _           
    //     / __|___ _ _  __| |_ _ _ _  _ __| |_ ___ _ _ 
    //    | (__/ _ \ ' \(_-<  _| '_| || / _|  _/ _ \ '_|
    //     \___\___/_||_/__/\__|_|  \_,_\__|\__\___/_|  
    private constructor(
        public interfaceType: InterfaceType,
        public dependencies: Dependencies
    ) { }
}