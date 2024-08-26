
import { defineNode } from "@thinairthings/uix";
import { z } from "zod";
import { CompanyNodeDefinition } from "./CompanyNodeDefinition";
import { JobNodeDefinition } from "./JobNodeDefinition";

const _UserNodeDefinition = defineNode('User', z.object({
    email: z.string().email('Invalid email address'),
    firstName: z.string().min(1, 'Please enter your first name.').optional(),
    lastName: z.string().min(1, 'Please enter your first name.').optional(),
    phoneNumber: z.string().min(10, 'Please enter a valid phone number.').optional(),
    profilePictureUrl: z.string().optional(),
}))
    .defineUniqueIndexes(['email'])
    .defineRelationship({
        relationshipType: 'BELONGS_TO',
        cardinality: 'many-to-many',
        strength: 'weak',
        toNodeDefinition: CompanyNodeDefinition,
        relationshipStateSchema: z.object({
            accessLevel: z.enum(['admin', 'member', 'owner']),
        })
    })
    .defineRelationship({
        cardinality: 'many-to-one',
        relationshipType: 'POSTED',
        strength: 'weak',
        toNodeDefinition: JobNodeDefinition,
    })


export const UserNodeDefinition = _UserNodeDefinition
    .defineRelationship({
        relationshipType: 'SUPERVISOR_TO',
        strength: 'weak',
        cardinality: 'one-to-many',
        toNodeDefinition: _UserNodeDefinition,
    })
    .defineRelationship({
        relationshipType: 'SWIPED_ON',
        strength: 'weak',
        cardinality: 'one-to-many',
        toNodeDefinition: JobNodeDefinition,
        relationshipStateSchema: z.object({
            lastSelected: z.number()
        })
    })