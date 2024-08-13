import { defineNode } from "@thinairthings/uix";
import { z } from "zod";
import { ProjectNodeDefinition } from "./ProjectNodeDefinition";

export const KanbanNodeDefinition = defineNode(
    "Kanban",
    z.object({
        title: z.string().min(1, "Please enter your board title"),
        description: z.string().optional(),
        status: z.enum(["Active", "Completed"]),
        columnOrder: z.array(z.string()),
    }),
)
    .defineRelationship({
        relationshipType: "BELONGS_TO",
        cardinality: "many-to-one",
        strength: "strong",
        toNodeDefinition: ProjectNodeDefinition,
    });
