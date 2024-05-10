import { z } from "zod";







export const uixNodeSchema = z.object({
    nodeType: z.string(),
    nodeId: z.string(),
    createdAt: z.string(),
    updatedAt: z.string().optional()
})