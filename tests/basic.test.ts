import { execSync } from 'child_process'
import { v4 as uuid } from 'uuid'
import { expect, test } from 'vitest'
import { Err, tryCatch, UixErrSubtype } from '../src/types/Result'
import { mergeNode } from './uix/generated/functionModule'
import { throwTestError } from './utils/throwTestError'

test('Integration test', async () => {
    const { data: uixData, error: uixError } = await tryCatch({
        try: () => execSync('pnpm uix'),
        catch: (e: Error) => Err({
            type: 'TestErr',
            subtype: 'UixError',
            message: e.message,
            data: { e }
        })
    })
    // Create Node
    const { data: userNode, error: createUserNodeError } = await mergeNode({
        operation: 'create',
        nodeType: 'User',
        state: {
            email: 'test@test.com'
        }
    })
    if (createUserNodeError) throwTestError(createUserNodeError)
    console.log("User Node", userNode)
    // Create Organization
    const { data: organizationNode, error: createOrganizationNodeError } = await mergeNode({
        operation: 'create',
        nodeType: 'Organization',
        weakRelationshipMap: {
            'ACCESS_TO': {
                from: [userNode],
                state: {
                    accessLevel: 'admin'
                }
            }
        },
        state: {
            name: "Wendy"
        }
    })
    if (createOrganizationNodeError) throwTestError(createOrganizationNodeError)
    // Update Permissions
    const { data: updatedUserNode } = await mergeNode({
        operation: 'update',
        ...userNode,
        weakRelationshipMap: {
            'ACCESS_TO': {
                to: [organizationNode],
                state: {
                    accessLevel: 'member'
                }
            }
        }
    })
    console.log("UpdatedUserNode", updatedUserNode)
})