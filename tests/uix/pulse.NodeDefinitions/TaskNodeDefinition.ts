import { defineNode } from "@thinairthings/uix";
import { z } from "zod";
import { KanbanNodeDefinition } from "./KanbanNodeDefinition";

export const TaskNodeDefinition = defineNode(
    "Task",
    z.object({
        title: z.string().min(1, "Please enter your task title"),
        description: z.string().optional(),
        dueDate: z.number().optional(),
        status: z.enum([
            "To Do",
            "Draft",
            "Progress",
            "In Review",
            "Completed",
        ]),
        priority: z.enum(["Low", "Medium", "High"]).catch("Low"),
        progress: z.number().catch(0),
    }),
)
.defineRelationship({
    relationshipType: "BELONGS_TO",
    cardinality: "many-to-one",
    strength: "strong",
    toNodeDefinition: KanbanNodeDefinition,
});
