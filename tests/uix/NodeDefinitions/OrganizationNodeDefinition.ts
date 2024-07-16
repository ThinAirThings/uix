

import { defineNode } from "@thinairthings/uix";
import { z } from "zod";

export const OrganizationNodeDefinition = defineNode('Organization', z.object({
    name: z.string().min(1, 'Please enter your organization'),
}))
    .defineUniqueIndexes(['name'])