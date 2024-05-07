import { defineBaseGraph, defineNode } from "../dist";
import { z } from "zod";



export const testGraph = defineBaseGraph({
    nodeDefinitions: [
        defineNode('User', z.object({
            name: z.string(),
            email: z.string().email(),
            password: z.string(),
            providerId: z.string().optional()
        })).uniqueIndexes(['email']),
        defineNode('Post', z.object({
            title: z.string(),
            content: z.string()
        })),
        defineNode('Company', z.object({
            name: z.string().optional()
        })),
        defineNode('BankAccount', z.object({
            accountNumber: z.string(),
            balance: z.number()
        })),
        defineNode('Profile', z.object({
            bio: z.string().optional(),
            profilePicture: z.string().optional()
        }))
    ],
    relationshipDefinitions: [{
        relationshipType: 'HAS_POST',
        stateDefinition: z.object({
            createdAt: z.string(),
            updatedAt: z.string()
        })
    }, {
        relationshipType: 'WORKED_AT'
    }, {
        relationshipType: 'HAS_BANK_ACCOUNT',
        stateDefinition: z.object({
            lastTransaction: z.string()
        })
    }] as const,
    edgeDefinitions: {
        'User': {
            'HAS_POST': ['Post'],
            'WORKED_AT': ['Company']
        },
        'Company': {
            'HAS_BANK_ACCOUNT': ['BankAccount']
        }
    } as const,
    uniqueIndexes: {
        'User': ['email', 'providerId'],
        'Company': ['name']
    }
})


// const g = defineReactCacheLayer(defineNeo4jLayer(testGraph, {} as any))

// const { data, isSuccess, error, isPending } = g.useNode('User', 'email', '',
//     (node) => {
//         return node.email
//     }
// )
// if (isPending) {
//     console.log('Loading...')
// }
// data
// data
// class Other extends Error {
//     thing: number
//     constructor(thing: number) {
//         super()
//         this.thing = thing
//     }
// }

// const {data} = useQuery({
//     queryKey: ['User', 'email', ''],
//     queryFn: async () => {
//         throw new Error('Error')
//         return await g.getNode('User', 'email', '')
//     },
//     select: (getNodeResult) => {
//         if (!getNodeResult.ok) return getNodeResult
//         return getNodeResult.val.email
//     }
// })

// useQuery