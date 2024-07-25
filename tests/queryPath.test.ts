import { execSync } from 'child_process'
import { v4 as uuid } from 'uuid'
import { expect, test } from 'vitest'
import { Err, tryCatch, UixErrSubtype } from '../src/types/Result'
import { QuerySubgraph, RootQueryPathNode } from '@thinairthings/uix'
import { nodeTypeMap } from './uix/generated/staticObjects'
import { collectNodev2 } from './uix/generated/functionModule'
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
    // console.log(JSON.stringify(QuerySubgraph.create(nodeTypeMap, 'User')
    //     .addNode('-ACCESS_TO->Organization',  {
    //         limit: 5
    //     })
    //     .addNode('<-BELONGS_TO-Project')
    //     .root()
    //     .addNode('<-SENT_BY-Message').getQueryTree()
    // , null, 2))
    const {data: userATreeNodeType} = await collectNodev2({
        referenceType: 'nodeType',
        nodeType: 'User',
        subgraphSelector: (subgraph) => subgraph
            .addNode('-ACCESS_TO->Organization',  {
                limit: 5
            })
            .addNode('<-BELONGS_TO-Project')
            .root()
            .addNode('<-SENT_BY-Message')
    })
    // if (userATreeNodeType) {
    //     userATreeNodeType.map(node => node['-ACCESS_TO->Organization'].map(node => node.ceo))
    // }
    const {data: userATreeNodeIndex} = await collectNodev2({
        referenceType: 'nodeIndex',
        nodeType: 'User',
        indexKey: 'email',
        indexValue: 'userA@test.com',
        subgraphSelector: (subgraph) => subgraph
            .addNode('-ACCESS_TO->Organization')
            .addNode('<-BELONGS_TO-Project')
            .root()
            .addNode('<-SENT_BY-Message')
    })
    // if (userATreeNodeIndex) {
    //     userATreeNodeIndex['-ACCESS_TO->Organization'].map(node => node['<-BELONGS_TO-Project'])
    //     userATreeNodeIndex['<-SENT_BY-Message']
    // }
    await writeFile('tests/queryPath:test:nodeType.json', JSON.stringify(userATreeNodeType, null, 2))
    await writeFile('tests/queryPath:test:nodeIndex.json', JSON.stringify(userATreeNodeIndex, null, 2))
})

