import { defineNodeType } from "@thinairthings/uix";
import { z } from "zod";
import { JobNodeType } from "./JobNodeType";

const sharedProperties = z.object({
    senderType: z.enum(['user', 'assistant', 'other']).catch('user'),
})

export const MessageNodeType = defineNodeType('Message', z.discriminatedUnion('contentType', [
    z.object({ contentType: z.literal('text'), text: z.string() }).merge(sharedProperties),
    z.object({ contentType: z.literal('jobNodeSet'), jobNodeSet: z.array(JobNodeType.shapeSchema) }).merge(sharedProperties),
]))