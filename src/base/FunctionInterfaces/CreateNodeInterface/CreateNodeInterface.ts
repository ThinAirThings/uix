import { TypeOf, z } from "zod"
import { FunctionInterface } from "../FunctionInterface"
import { uixNodeSchema } from "../../Node/UixNodeSchema"
import { GraphDefinitionAny } from "../../Graph/GraphDefinition"
import { Result } from "@/src/types/Result"
import { UixNode } from "@/src/types/UixNode"




export const CreateNodeInterface = FunctionInterface
    .define('CreateNode', {
        input: z.tuple([z.string(), z.object({ cheese: z.string() })]),
        success: uixNodeSchema,
        error: z.object({ err: z.string() })
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