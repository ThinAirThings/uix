import { defineGraph, defineNode } from "../dist";
import { z } from "zod";



export const testGraph = defineGraph({
    nodeDefinitions: [
        defineNode('User' as const, z.object({
            name: z.string(),
            email: z.string().email(),
            password: z.string()
        })),
        defineNode('Post' as const, z.object({
            title: z.string(),
            content: z.string()
        })),
        defineNode('Company' as const, z.object({
            name: z.string()
        })),
        defineNode('BankAccount' as const, z.object({
            accountNumber: z.string(),
            balance: z.number()
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
        'User': ['email'],
        'Company': ['name']
    }
})