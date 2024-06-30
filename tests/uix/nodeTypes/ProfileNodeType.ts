import { defineNodeType } from "@thinairthings/uix"
import { z } from 'zod'

export const ProfileNodeType = defineNodeType('Profile', z.object({
    aboutMe: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    skills: z.string().array().catch([]),
    promptTitle: z.string().optional(),
    promptSummary: z.string().optional(),
    resumeName: z.string().optional(),
    resumeUrl: z.string().optional(),
}))

    .definePropertyVector(['aboutMe', 'promptTitle', 'promptSummary'])