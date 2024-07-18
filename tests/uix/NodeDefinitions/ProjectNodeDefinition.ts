import { z } from "zod";
import { defineNode } from "@thinairthings/uix";
import { OrganizationNodeDefinition } from "./OrganizationNodeDefinition";
import { UserNodeDefinition } from "./UserNodeDefinition";


export const ProjectNodeDefinition = defineNode('Project', z.object({
    name: z.string().min(1, 'Please enter a project name.'),
}))
    .defineRelationship({
        relationshipType: 'BELONGS_TO',
        strength: 'strong',
        cardinality: 'many-to-one',
        toNodeDefinition: OrganizationNodeDefinition,
        relationshipStateSchema: z.object({
            testing: z.string()
        })
    })