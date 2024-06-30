import { defineNodeType } from "@thinairthings/uix";
import { z } from "zod";


export const WorkExperienceNodeType = defineNodeType('WorkExperience', z.object({
    companyName: z.string().catch(''),
    title: z.string().catch(''),
    description: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    currentlyHere: z.boolean().optional()
}))
    .definePropertyVector(['companyName', 'title', 'description'])