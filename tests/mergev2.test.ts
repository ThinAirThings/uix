import { execSync } from 'child_process'
import { test } from 'vitest'
import { Err, tryCatch } from '../src/types/Result'
import { extractSubgraph, mergeSubgraphv2, mergeSubgraphv3 } from './uix/generated/functionModule'
import { throwTestError } from './utils/throwTestError'
import { writeFile } from 'fs/promises'
test('Integration test', async () => {
    // Create Node
    const { data: createUserNode, error: createUserNodeError } = await mergeSubgraphv2({        
        operation: 'create',
        state: {
            'email': 'userA@test.com',
            '-ACCESS_TO->Organization': [{
                accessLevel: 'member',
                name: 'Ranger Solar',
                employees: 100,
                ceo: 'Bob Johnson', 
            }, {
                accessLevel: 'owner',
                name: 'Thin Air',
                employees: 1000,
                ceo: 'Dan Lannan',
            }],
            // '<-SENT_BY-Message': [{
            //     'contentType': 'text',
            //     text: 'Hello, World!'
            // }]
        },
        nodeType: 'User',
        subgraphSpec: (spec) => spec
            .addNode('-ACCESS_TO->Organization')
            // .addNode('<-BELONGS_TO-Project')
            .root()
            // .addNode('<-SENT_BY-Message')
    })
    const {data: merge, error} = await mergeSubgraphv3({
        nodeType: 'User',
        email: "Dan",
        '-ACCESS_TO->Organization': [{
            'accessLevel': 'member',
            'ceo': 'Bob Johnson',
            'employees': 100,
            'name': 'Ranger Solar',
        }],
        // nodeId: 'fdsa', 
    }) 
    const thing = merge!
    const {data: update} = await mergeSubgraphv3(merge!, (draft) => {
        draft['-ACCESS_TO->Organization']
    }) 
    update!['-ACCESS_TO->Organization'][0]
    if (createUserNodeError) throwTestError(createUserNodeError)
    if (createUserNode) {
        await writeFile('tests/mergev2:data.json', JSON.stringify(createUserNode, null, 2))
    }
    // UpdateNode
    const { data: userNodeA, error: createUserNodeAError } = await mergeSubgraphv2({
        nodeType: 'User',
        operation: 'update',
        subgraph: createUserNode, 
        updater: (draft) => {
            draft['-ACCESS_TO->Organization'][0].ceo = 'Bobothy'
        }
    })
    if (userNodeA) {
        await writeFile('tests/mergev2:data.json', JSON.stringify(userNodeA, null, 2))
    }
    // await writeFile('tests/mergev2:queryString.cypher', userNodeA!)
})