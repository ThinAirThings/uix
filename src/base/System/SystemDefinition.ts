import { Ok } from "@/src/types/Result";
import { CreateNodeInterface, GenericCreateNodeInterface } from "../FunctionInterfaces/CreateNodeInterface/CreateNodeInterface";
import { GraphDefinition as GraphDefinitionDefault, GraphDefinitionAny } from "../Graph/GraphDefinition";
import { v4 as uuidv4 } from 'uuid'
import { DependenciesDefinitionAny, PossibleConfiguration } from "../Dependencies/DependenciesDefinition";


//  _   _ _   _ _ _ _          _____                  
// | | | | |_(_) (_) |_ _  _  |_   _|  _ _ __  ___ ___
// | |_| |  _| | | |  _| || |   | || || | '_ \/ -_|_-<
//  \___/ \__|_|_|_|\__|\_, |   |_| \_, | .__/\___/__/
//                      |__/        |__/|_|  
export type SystemDefinitionAny = SystemDefinition<any, any, any>
type PossibleDependenciesDefinition<T> = T extends DependenciesDefinitionAny ? T : never
type PossibleSubSystem<T> = T extends SystemDefinitionAny ? [T] : []
//  ___       __ _      _ _   _          
// |   \ ___ / _(_)_ _ (_) |_(_)___ _ _  
// | |) / -_)  _| | ' \| |  _| / _ \ ' \ 
// |___/\___|_| |_|_||_|_|\__|_\___/_||_| 
export class SystemDefinition<
    SystemType extends Capitalize<string> = Capitalize<string>,
    DependenciesDefinition extends DependenciesDefinitionAny | undefined = undefined,
    CreateNodeInterface extends typeof CreateNodeInterface | undefined = typeof CreateNodeInterface | undefined
> {
    static define = <
        SystemType extends Capitalize<string>,
    >(
        systemType: SystemType
    ) => new SystemDefinition(systemType)
    private constructor(
        public systemType: SystemType,
        public dependenciesDefinition: DependenciesDefinition = undefined as DependenciesDefinition,
        public createNodeInterface: CreateNodeInterface = undefined as CreateNodeInterface,
    ) { }
    defineDependencies<
        DependenciesDefinition extends DependenciesDefinitionAny
    >(
        dependenciesDefinition: DependenciesDefinition
    ) {
        return new SystemDefinition(
            this.systemType,
            dependenciesDefinition
        )
    }
    // The Error type of this is generic
    defineCreateNodeInterface(
        createNodeInterface: typeof CreateNodeInterface
    ) {
        return new 
    }
    createSystem<
        GraphDefinition extends GraphDefinitionAny,
        System extends SystemDefinitionAny
    >(
        graphDefinition: GraphDefinition,
        ...[configuration, subsystem]: [
            ...PossibleConfiguration<PossibleDependenciesDefinition<DependenciesDefinition>['configurationDefinition']>,
            ...PossibleSubSystem<System>
        ]
    ) {
        const dependencies = configuration ? this.dependenciesDefinition?.initializer(configuration) : null
        return System()
    }
    // createNode: GenericCreateNodeInterface<GraphDefinition, any> = async (
    //     nodeType,
    //     initialState
    // ) => {
    //     return Ok({
    //         nodeType,
    //         nodeId: uuidv4(),
    //         createdAt: new Date().toISOString(),
    //         ...initialState,
    //     })
    // }
}


