

import { defineNode } from "@thinairthings/uix";
import { z } from "zod";

export const OrganizationNodeDefinition = defineNode('Organization', z.object({
    name: z.string().min(1, 'Please enter your organization'),
    ceo: z.string().min(1, 'Please enter the name of the CEO'),
    founded: z.date().optional(),
    employees: z.number().nonnegative(),
}))
    .defineUniqueIndexes(['name'])