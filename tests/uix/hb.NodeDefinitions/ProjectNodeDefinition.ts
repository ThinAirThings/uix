import { z } from "zod";
import { defineNode } from "@thinairthings/uix";
import { UserNodeDefinition } from "../hb.NodeDefinitions/UserNodeDefinition";
import { CompanyNodeDefinition } from "./CompanyNodeDefinition";


export const ProjectNodeDefinition = defineNode('Project', z.object({
    name: z.string().min(1, 'Please enter a project name.'),
    description: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
}))
    .defineRelationship({
        relationshipType: 'BELONGS_TO',
        strength: 'strong',
        cardinality: 'many-to-one',
        toNodeDefinition: CompanyNodeDefinition
    })