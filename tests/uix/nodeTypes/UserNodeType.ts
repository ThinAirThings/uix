
import { defineNodeType } from "@thinairthings/uix"
import { z } from "zod"
import { EducationNodeType } from "./EducationNodeType"
import { WorkExperienceNodeType } from "./WorkExperienceNodeType"
import { ProfileNodeType } from "./ProfileNodeType"
import { WorkPreferenceNodeType } from "./WorkPreferenceNodeType"
import { JobNodeType } from "./JobNodeType"

export const UserNodeType = defineNodeType('User', z.object({
    firstName: z.string().min(1, { message: 'First name is required' }),
    lastName: z.string().min(1, { message: 'Last name is required' }),
    email: z.string().email({ message: 'Invalid email address' }),
    userType: z.enum(['Employer', 'Candidate', 'Unspecified']).catch('Unspecified'),
    completedOnboardingV2: z.boolean().catch(false),
    phoneNumber: z.string().min(10, { message: 'Phone number is required' }).optional(),
    profileImageUrl: z.string().optional(),
}))
    .defineUniqueIndexes(['email'])
    .defineUniqueRelationship(ProfileNodeType)
    .defineUniqueRelationship(WorkPreferenceNodeType)
    .defineNodeSetRelationship(EducationNodeType)
    .defineNodeSetRelationship(WorkExperienceNodeType)
    .defineMatchToRelationshipType({
        type: 'Person',
        description:
            + `A profile type node that represents a user's profile type.`
            + `This type should holistically represent the person who owns the profile such that all semantic meaning relevant to how this person would fit for a job position is captured.`,
        matchToNodeType: JobNodeType,
        weightednodeDefinitionSet: [
            { weight: 1, NodeType: EducationNodeType },
            { weight: 3, NodeType: WorkExperienceNodeType },
            { weight: 5, NodeType: ProfileNodeType },
            { weight: 2, NodeType: WorkPreferenceNodeType },
        ]
    })
