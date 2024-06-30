import { defineNodeType } from "@thinairthings/uix"
import { z } from "zod"
import { degrees } from "./enums/degrees"
import { fieldsOfStudy } from "./enums/fieldsOfStudy"

export const EducationNodeType = defineNodeType('Education', z.object({
    school: z.string().catch(''),
    degree: z.enum(degrees).catch('Unspecified'),
    fieldOfStudy: z.enum(fieldsOfStudy).catch('Other'),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    description: z.string().optional(),
}))
    .definePropertyVector(['school', 'degree', 'fieldOfStudy', 'description'])