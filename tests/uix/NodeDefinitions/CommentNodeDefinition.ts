import { defineNode } from "@thinairthings/uix";
import { z } from "zod";
import { UserNodeDefinition } from "./UserNodeDefinition";
import { TaskNodeDefinition } from "./TaskNodeDefinition";

export const CommentNodeDefinition = defineNode(
    "Comment",
    z.object({
        action: z
            .enum(["created task", "updated task", "removed user(s)"])
            .optional(),
        message: z.string().optional(),
        sentAt: z.number().catch(new Date().getTime()),
    }),
)
    .defineRelationship({
        relationshipType: "BELONGS_TO",
        cardinality: "many-to-one",
        strength: "strong",
        toNodeDefinition: TaskNodeDefinition,
    })
    .defineRelationship({
        relationshipType: "SENT_BY",
        cardinality: "many-to-one",
        strength: "strong",
        toNodeDefinition: UserNodeDefinition,
    });
