import { defineNodeType } from "@thinairthings/uix"
import { z } from "zod"
import { industries } from "./enums/industries"

export const WorkPreferenceNodeType = defineNodeType('WorkPreference', z.object({
    industryPreferenceSet: z.enum(industries).array().catch(['Other']),
    workPreferenceSet: z.enum(['Remote', 'Onsite', 'Hybrid']).array().catch(['Onsite']),
    positionTypePreferenceSet: z.enum(['Full-Time', 'Part-Time', 'Contract', 'Internship']).array().catch(['Full-Time']),
}))
