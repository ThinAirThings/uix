


import { defineNode } from "@thinairthings/uix";
import { z } from "zod";
import { ChatNodeDefinition } from "./ChatNodeDefinition";
import { UserNodeDefinition } from "../hb.NodeDefinitions/UserNodeDefinition";

export const MessageNodeDefinition = defineNode('Message', z.discriminatedUnion('contentType', [
    z.object({
        contentType: z.literal('text'), 
        text: z.string().min(1), 
    }),
    z.object({
        contentType: z.literal('image'), 
        imageUrl: z.string().url(),
    }),
]))
    .defineRelationship({
        relationshipType: 'SENT_IN',
        strength: 'strong',
        cardinality: 'many-to-one',
        toNodeDefinition: ChatNodeDefinition
    })
    .defineRelationship({
        relationshipType: 'SENT_BY',
        strength: 'strong',
        cardinality: 'many-to-one',
        toNodeDefinition: UserNodeDefinition
    })