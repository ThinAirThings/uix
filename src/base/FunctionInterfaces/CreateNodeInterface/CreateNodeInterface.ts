import { TypeOf, z } from "zod"
import { FunctionInterface, GenericFunctionImplementation } from "../FunctionInterface"
import { uixNodeSchema } from "../../Node/UixNodeSchema"
import { GraphDefinitionAny } from "../../Graph/GraphDefinition"
import { Ok, Result } from "@/src/types/Result"
import { UixNode } from "@/src/types/UixNode"
import { v4 as uuidv4 } from 'uuid'
import { SystemAny } from "../../System/System"



export const CreateNodeInterface = FunctionInterface
    .define('CreateNode', {
        input: z.tuple([z.string(), z.object({ cheese: z.string() })]),
        success: uixNodeSchema,
        error: z.object({ err: z.string() })
    })
    // You might want to make this generic
    .defineGenericInterfaceFactory(<
        GraphDefinition extends GraphDefinitionAny,
        System extends SystemAny,
        Implementation extends GenericFunctionImplementation<any, any, any, any>
    >(graph: GraphDefinition, subsystem: System, implementation: Implementation) => async<
        NodeType extends GraphDefinition['nodeDefinitions'][number]['nodeType'],
        InitialState extends TypeOf<(GraphDefinition['nodeDefinitions'][number])['stateSchema']>
    >(nodeType: NodeType, initialState: InitialState) => {
            return subsystem ?
                implementation(graph, subsystem, nodeType, initialState)
                : Ok({
                    nodeType,
                    nodeId: uuidv4(),
                    createdAt: new Date().toISOString(),
                    ...initialState,
                })
        })

export type GenericCreateNodeInterface<
    GraphDefinition extends GraphDefinitionAny,
    ErrorType
> = <
    NodeType extends GraphDefinition['nodeDefinitions'][number]['nodeType'],
    InitialState extends TypeOf<(GraphDefinition['nodeDefinitions'] & { nodeType: NodeType })['stateSchema']>
>(
    nodeType: NodeType,
    initialState: InitialState
) => Promise<Result<
    UixNode<NodeType, InitialState>,
    ErrorType
>>