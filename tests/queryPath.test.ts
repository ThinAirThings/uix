import { execSync } from 'child_process'
import { v4 as uuid } from 'uuid'
import { expect, test } from 'vitest'
import { Err, tryCatch, UixErrSubtype } from '../src/types/Result'
import { RootQueryPathNode } from '@thinairthings/uix'
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
    const {data: userATree} = await collectNodev2({
        referenceType: 'nodeType',
        nodeType: 'User',
        // nodeType: 'User',
        // referenceType: 'nodeIndex',
        // indexKey: 'email',
        // indexValue: 'userA@test.com',
        queryPath: (root) => root
            .hop('ACCESS_TO->', 'Organization')
            .hop('<-BELONGS_TO', 'Project')
            .root
            .hop('<-SENT_BY', 'Message')
    })
    if (userATree) {
        // userATree.root.childQueryPathNodeSet[0]
    }
    // userATree?.root.childQueryPathNodeSet[0].nodeType
    await writeFile('tests/queryPath:test.json', JSON.stringify(userATree, null, 2))
    // const userSubgraphNode = new RootQueryPathNode(nodeTypeMap, 'User')
    //     .hop('to', 'Organization', 'ACCESS_TO')
    //     .hop('from', 'Project', 'BELONGS_TO')
    //     .root
    //     .hop('from', 'Message', 'SENT_BY')
    // userSubgraphNode.parentQueryPathNode.childQueryPathNodeSet[0].nodeType

    // const userSubgraphNode = new RootQueryPathNode(nodeTypeMap, 'User')
    //     .hop('ACCESS_TO->', 'Project', {
    //         limit: 1
    //     })
    //     .hop('BELONGS_TO->', 'Organization')
    //     // .root
    //     // .hop('ACCESS_TO->', 'Organization')
    // type Thing = typeof userSubgraphNode.parentQueryPathNode.childQueryPathNodeSet[0]['nodeType']
    
    // userSubgraphNode.parentQueryPathNode.parentQueryPathNode.nodeType
})

