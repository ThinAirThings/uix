import { defineNode } from '@thinairthings/uix';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { _UserNodeDefinition, UserNodeDefinition } from './UserNodeDefinition';
import { CompanyNodeDefinition } from './CompanyNodeDefinition';

export const JobNodeDefinition = defineNode('Job',z.object({
        companyName: z.string().transform((val) => val === 'Bandana' ? 'Hirebird' : val),
        description: z.string(),
        title: z.string().describe('Job Title'),
    })
)
    .defineRelationship({
        cardinality: 'many-to-one',
        relationshipType: 'BELONGS_TO',
        strength: 'strong',
        toNodeDefinition: CompanyNodeDefinition,
    })
    .defineUniqueIndexes(['title'])
