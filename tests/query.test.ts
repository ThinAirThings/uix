import { execSync } from 'child_process'
import { v4 as uuid } from 'uuid'
import { expect, test } from 'vitest'
import { Err, tryCatch, UixErrSubtype } from '../src/types/Result'
import { mergeNode, deleteNode, collectNode } from './uix/generated/functionModule'
import { throwTestError } from './utils/throwTestError'
import { writeFile } from 'fs/promises'

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
    // Get User A
    const { data: userATree } = await collectNode({
        referenceType: 'nodeType',
        nodeType: 'User',
        // referenceType: 'nodeIndex',
        // nodeType: 'User',
        // indexKey: 'email',
        // indexValue: "userB@test.com",
        'ACCESS_TO': {
            direction: 'to',
            nodeType: 'Organization',
            options: { limit: 1 },
            'BELONGS_TO': {
                direction: 'from',
                nodeType: 'Project',
                options: { limit: 1 }
            }
        },
        'SENT_BY': {
            direction: 'from',
            nodeType: 'Message',
            options: { limit: 2 }
        }
    })
    // const thing = userATree.
    await writeFile('tests/query:test.json', JSON.stringify(userATree, null, 2))
})