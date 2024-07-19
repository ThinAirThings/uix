import { writeFile } from "fs/promises"
import {collectNode} from "../tests/uix/generated/functionModule"
import dotenv from 'dotenv'
import { execSync } from "child_process"
import { Err, tryCatch } from "../src"
dotenv.config({
    path: '.env.test'
})
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
const { data: userAByGet } = await collectNode({
    referenceType: 'nodeIndex',
    nodeType: 'User',
    indexKey: 'email',
    indexValue: "userA@test.com",
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
await writeFile('tests/collectNode:scratch.json', JSON.stringify(userAByGet, null, 2))