import { Ok } from "@/src/types/Result";
import { GenericCreateNodeInterface } from "../FunctionInterfaces/CreateNodeInterface/CreateNodeInterface";
import { GraphDefinitionAny } from "../Graph/GraphDefinition";
import { v4 as uuidv4 } from 'uuid'
import { SystemDefinition as SystemDefinitionDefault, SystemDefinitionAny } from "./SystemDefinition";



export type SystemAny = System<any, any, any>

// NOTES: I'm not sure you need System Definition to be generic here. 
export class System<
    GraphDefinition extends GraphDefinitionAny,
    SystemDefinition extends SystemDefinitionAny,
    SubSystem extends SystemAny | undefined = undefined
> {
    dependencies: SystemDefinition['dependenciesDefinition']
    constructor(
        public graphDefinition: GraphDefinition,
        public systemDefinition: SystemDefinition,
        public subsystem: SubSystem = undefined as SubSystem
    ) {

    }
    createNode: GenericCreateNodeInterface<GraphDefinition, any> = async (
        nodeType,
        initialState
    ) => {
        return this.subsystem
            ? (<SystemDefinitionDefault>this.systemDefinition).createNodeInterface?.implementation?.(
                this.graphDefinition,
                this.subsystem,
                nodeType,
                initialState,
                // You left off here
            )
            : Ok({
                nodeType,
                nodeId: uuidv4(),
                createdAt: new Date().toISOString(),
                ...initialState,
            })
    }
}