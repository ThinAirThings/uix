import { Ok } from "@/src/types/Result";
import { CreateNodeInterface, GenericCreateNodeInterface } from "../FunctionInterfaces/CreateNodeInterface/CreateNodeInterface";
import { GraphDefinition as GraphDefinitionDefault, GraphDefinitionAny } from "../Graph/GraphDefinition";
import { v4 as uuidv4 } from 'uuid'
import { DependenciesDefinitionAny } from "../Dependencies/DependenciesDefinition";


// Moved on
export class System<
    SystemType extends Capitalize<string> = Capitalize<string>,
    DependenciesDefinition extends DependenciesDefinitionAny | undefined = undefined,
    GraphDefinition extends GraphDefinitionAny | undefined = undefined,

> {
    static define = <
        SystemType extends Capitalize<string>,
    >(
        systemType: SystemType
    ) => new System(systemType)
    private constructor(
        public systemType: SystemType,
        public dependenciesDefinition: DependenciesDefinition = undefined as DependenciesDefinition,
        public graphDefinition: GraphDefinition = undefined as GraphDefinition,
        public createNodeInterface?: typeof CreateNodeInterface,
    ) { }
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