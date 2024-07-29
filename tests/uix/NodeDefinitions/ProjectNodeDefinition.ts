import { z } from "zod";
import { defineNode } from "@thinairthings/uix";
import { OrganizationNodeDefinition } from "./OrganizationNodeDefinition";
import { UserNodeDefinition } from "./UserNodeDefinition";


export const ProjectNodeDefinition = defineNode('Project', z.object({
    name: z.string().min(1, 'Please enter a project name.'),
    description: z.string().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
}))
    .defineRelationship({
        relationshipType: 'BELONGS_TO',
        strength: 'strong',
        cardinality: 'many-to-one',
        toNodeDefinition: OrganizationNodeDefinition
    })