import { ZodObject, z } from "zod";
import { NodeDefinition, defineNode } from "./defineNode";








export const defineGraph = <
    N extends readonly NodeDefinition<any, any, any, any>[],
>({
    nodeDefinitions,
}: {
    nodeDefinitions: N,
}) => new GraphDefinition<N, []>(nodeDefinitions, [])

export const testGraph = defineGraph({
    nodeDefinitions: [
        defineNode('User' as const, z.object({
            name: z.string(),
            email: z.string().email(),
            password: z.string(),
            providerId: z.string().optional()
        })),
        defineNode('Post' as const, z.object({
            title: z.string(),
            content: z.string()
        })),
        defineNode('Company' as const, z.object({
            name: z.string().optional()
        })),
        defineNode('BankAccount' as const, z.object({
            accountNumber: z.string(),
            balance: z.number()
        })).uniqueIndexes(['accountNumber']).defaults({
            balance: 0,
            accountNumber: ''
        }),
        defineNode('Profile' as const, z.object({
            bio: z.string().optional(),
            profilePicture: z.string().optional()
        })).uniqueIndexes(['bio'])
    ]
}).defineRelationship(['User'], 'HAS_POST', ['Post'])