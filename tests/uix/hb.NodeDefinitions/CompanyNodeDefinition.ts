import { defineNode } from "@thinairthings/uix"
import { z } from "zod"

export const CompanyNodeDefinition = defineNode('Company', z.object({
    name: z.string(),
}))
    .defineUniqueIndexes(['name'])