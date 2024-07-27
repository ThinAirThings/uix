import { execSync } from 'child_process'
import { test } from 'vitest'
import { Err, tryCatch } from '../src/types/Result'
import { extractSubgraph, mergeSubgraphv2 } from './uix/generated/functionModule'
import { throwTestError } from './utils/throwTestError'
import { writeFile } from 'fs/promises'
test('Integration test', async () => {
    // Create Node
    const { data: userNodeCreate, error: createUserNodeCreateError } = await mergeSubgraphv2({        
        operation: 'create',
        state: {
            'email': '',
            '-ACCESS_TO->Organization': [],
        },
        nodeType: 'User',
        subgraphSpec: (spec) => spec
            .addNode('-ACCESS_TO->Organization')
            // .addNode('<-BELONGS_TO-Project')
            // .root()
            // .addNode('<-SENT_BY-Message')
        
    })
    // UpdateNode
    const { data: userNodeA, error: createUserNodeAError } = await mergeSubgraphv2({
        nodeType: 'User',
        operation: 'update',
        subgraph: {
            nodeType: 'User', 
            'email': 'daniel@testing.com',
            '-ACCESS_TO->Organization': [{
                'accessLevel': 'member',
                'ceo': 'Bob Johnson',
                'nodeType': 'Organization',
                'employees': 100,
                'name': 'Ranger Solar',
                '<-BELONGS_TO-Project': [{
                    'name': "Project 1",
                    'nodeType': 'Project',
                    'testing': 'fdsafsd',
                }]
            }],
            '<-SENT_BY-Message': [{
                nodeType: 'Message',
                'contentType': 'image',
                'imageUrl': 'https://thinair.cloud',
            }, {
                nodeType: 'Message',
                'contentType': 'text',
                'text': 'Hello World'
            }]
        }, 
        updater: (draft) => {
            draft['-ACCESS_TO->Organization'][0].ceo = 'Bobothy'
        }
    })
    userNodeA!
    // if (userNodeA) {
    //     await writeFile('tests/mergev2:data.json', JSON.stringify(userNodeA, null, 2))
    // }
    // await writeFile('tests/mergev2:queryString.cypher', userNodeA!)
})