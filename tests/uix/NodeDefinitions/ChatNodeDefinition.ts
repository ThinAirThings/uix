
import {defineNode} from "@thinairthings/uix"
import { z } from "zod"
import { UserNodeDefinition } from "./UserNodeDefinition"


export const ChatNodeDefinition = defineNode('Chat', z.object({
    chatType: z.enum(['gpt', 'user']),
}))
    .defineRelationship({
        relationshipType: 'CONVERSATION_BETWEEN',
        strength: 'strong',
        cardinality: 'many-to-many',
        toNodeDefinition: UserNodeDefinition
    })