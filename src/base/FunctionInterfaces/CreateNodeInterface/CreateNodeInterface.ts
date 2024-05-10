import { z } from "zod"
import { FunctionInterface } from "../FunctionInterface"
import { uixNodeSchema } from "../../Node/UixNodeSchema"






export const CreateNodeInterface = FunctionInterface
    .define('CreateNode', {
        input: z.tuple([z.string(), z.object({ cheese: z.string() })]),
        success: uixNodeSchema,
        error: z.object({ err: z.string() })
    })