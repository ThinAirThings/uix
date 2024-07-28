import { execSync } from 'child_process'
import {  test } from 'vitest'
import { Err, tryCatch } from '../src/types/Result'
import { extractSubgraph } from './uix/generated/functionModule'
import { writeFile } from 'fs/promises'

test('Query path test', async () => {
    const { data: uixData, error: uixError } = await tryCatch({
        try: () => execSync('pnpm uix'),
        catch: (e: Error) => Err({
            type: 'TestErr',
            subtype: 'UixError',
            message: e.message,
            data: { e }
        })
    })
    const {data: userATreeNodeType} = await extractSubgraph({
        referenceType: 'nodeType',
        nodeType: 'User',
        subgraphSelector: (subgraph) => subgraph
            .addNode('-ACCESS_TO->Organization')
            .addNode('<-BELONGS_TO-Project')
            .root()
            .addNode('<-SENT_BY-Message')
    })
    if (userATreeNodeType) {
        userATreeNodeType.map(node => node['-ACCESS_TO->Organization'].map(node => node))
    }
    const {data: userATreeNodeIndex} = await extractSubgraph({
        referenceType: 'nodeIndex',
        nodeType: 'User',
        indexKey: 'email',
        indexValue: 'userA@test.com',
        subgraphSelector: (subgraph) => subgraph
            .addNode('-ACCESS_TO->Organization')
            .addNode('<-BELONGS_TO-Project')
            .root()
            // .addNode('-ACCESS_TO->Organization')
            // .addNode('<-BELONGS_TO-Project')
            // .addNode('<-SENT_BY-Message')
    })
    console.log(userATreeNodeIndex)
    if (userATreeNodeIndex) {
        userATreeNodeIndex['-ACCESS_TO->Organization'].map(node => node)
        // userATreeNodeIndex['-ACCESS_TO->Organization']
    }
    await writeFile('tests/queryPath:test:nodeType.json', JSON.stringify(userATreeNodeType, null, 2))
    await writeFile('tests/queryPath:test:nodeIndex.json', JSON.stringify(userATreeNodeIndex, null, 2))
})

