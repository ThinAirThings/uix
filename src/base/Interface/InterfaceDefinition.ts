import { ZodTypeAny } from "zod";
import { DependenciesDefinition, DependenciesDefinitionAny, GenericInitializer } from "../Dependencies/DependenciesDefinition";
import { FunctionInterface, FunctionInterfaceAny, GenericFunctionImplementation } from "../FunctionInterfaces/FunctionInterface";


//  _   _ _   _ _ _ _          _____                  
// | | | | |_(_) (_) |_ _  _  |_   _|  _ _ __  ___ ___
// | |_| |  _| | | |  _| || |   | || || | '_ \/ -_|_-<
//  \___/ \__|_|_|_|\__|\_, |   |_| \_, | .__/\___/__/
//                      |__/        |__/|_|  

export type FunctionInterfacesDefault = readonly FunctionInterface[]
export type FunctionInterfacesAny = readonly FunctionInterfaceAny[]
export type MetaInterfaceDefinitionAny = MetaInterfaceDefinition<any, any, any>
//  ___       __ _      _ _   _          
// |   \ ___ / _(_)_ _ (_) |_(_)___ _ _  
// | |) / -_)  _| | ' \| |  _| / _ \ ' \ 
// |___/\___|_| |_|_||_|_|\__|_\___/_||_| 
export class MetaInterfaceDefinition<
    InterfaceType extends Capitalize<string> = Capitalize<string>,
    FunctionInterfaces extends FunctionInterfacesAny = FunctionInterfacesDefault,
    DependenciesDefinition extends DependenciesDefinitionAny | undefined = undefined
> {
    //  ___ _        _   _      ___             _   _             
    // / __| |_ __ _| |_(_)__  | __|  _ _ _  __| |_(_)___ _ _  ___
    // \__ \  _/ _` |  _| / _| | _| || | ' \/ _|  _| / _ \ ' \(_-<
    // |___/\__\__,_|\__|_\__| |_| \_,_|_||_\__|\__|_\___/_||_/__/
    static define = <
        InterfaceType extends Capitalize<string>,
        FunctionInterfaces extends FunctionInterfacesAny,
        DependenciesDefinition extends DependenciesDefinitionAny | undefined = undefined
    >(
        interfaceType: InterfaceType,
        functionInterfaces: FunctionInterfaces,
        dependenciesDefinition?: DependenciesDefinition,
    ) => class AbstractInterfaceDefinition extends MetaInterfaceDefinition<
        InterfaceType, FunctionInterfaces, DependenciesDefinition
    > {
            constructor() {
                super(
                    interfaceType,
                    functionInterfaces,
                    dependenciesDefinition
                )
            }
        }
    //  ___                       _   _        
    // | _ \_ _ ___ _ __  ___ _ _| |_(_)___ ___
    // |  _/ '_/ _ \ '_ \/ -_) '_|  _| / -_|_-<
    // |_| |_| \___/ .__/\___|_|  \__|_\___/__/
    //             |_|
    metaInterface: {
        [FunctionType in FunctionInterfaces[number]['functionType']]: (FunctionInterfaces[number] & { functionType: FunctionType })
    }
    //      ___             _               _           
    //     / __|___ _ _  __| |_ _ _ _  _ __| |_ ___ _ _ 
    //    | (__/ _ \ ' \(_-<  _| '_| || / _|  _/ _ \ '_|
    //     \___\___/_||_/__/\__|_|  \_,_\__|\__\___/_|  
    private constructor(
        public interfaceType: InterfaceType,
        public functionInterfaces: FunctionInterfaces,
        public dependenciesDefinition?: DependenciesDefinition
    ) {
        this.metaInterface = functionInterfaces.reduce((fnInterface, entry) => {
            return Object.assign(fnInterface, {
                [entry.functionType]: entry
            })
        }, {} as typeof this.metaInterface)
    }

}


// [FunctionType in FunctionInterfaces[number]['functionType']]: GenericFunctionImplementation<
// // (FunctionInterfaces[number] & { functionType: FunctionType })['inputSchema'],
// // (FunctionInterfaces[number] & { functionType: FunctionType })['successSchema'],
// // (FunctionInterfaces[number] & { functionType: FunctionType })['errorSchema'],
// // DependenciesDefinition
// >