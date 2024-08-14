

import { defineNode } from '@thinairthings/uix';
import { z } from 'zod';
import { UserNodeDefinition } from './UserNodeDefinition';

export const MessageNodeDefinition = defineNode('Message', z.object({
    text: z.string()
}))
    .defineRelationship({
        relationshipType: "SENT_BY",
        'cardinality': 'many-to-one',
        'strength': 'strong',
        toNodeDefinition: UserNodeDefinition
    })