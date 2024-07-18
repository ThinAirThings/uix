
import { defineNode } from "@thinairthings/uix";
import { z } from "zod";
import { OrganizationNodeDefinition } from "./OrganizationNodeDefinition";
import { ProjectNodeDefinition } from "./ProjectNodeDefinition";

export const UserNodeDefinition = defineNode('User', z.object({
    email: z.string().email('Invalid email address'),
    firstName: z.string().min(1, 'Please enter your first name.').optional(),
    lastName: z.string().min(1, 'Please enter your first name.').optional(),
    phoneNumber: z.string().min(10, 'Please enter a valid phone number.').optional(),
    profilePictureUrl: z.string().optional(),
    activeOrganizationId: z.string().optional(),
}))
    .defineUniqueIndexes(['email'])
    .defineRelationship({
        relationshipType: 'ACCESS_TO',
        cardinality: 'many-to-many',
        strength: 'weak',
        toNodeDefinition: OrganizationNodeDefinition,
        relationshipStateSchema: z.object({
            accessLevel: z.enum(['admin', 'member', 'owner'])
        })
    })
    .defineRelationship({
        relationshipType: 'ACCESS_TO',
        strength: 'weak',
        cardinality: 'many-to-many',
        toNodeDefinition: ProjectNodeDefinition,
        relationshipStateSchema: z.object({
            accessLevel: z.enum(['admin', 'member', 'owner']),
        })
    })
