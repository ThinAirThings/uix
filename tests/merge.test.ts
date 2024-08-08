import { test } from 'vitest'
import { extractSubgraph, mergeSubgraph } from './uix/generated/functionModule'
import { throwTestError } from './utils/throwTestError'
import { writeFile } from 'fs/promises'
import { produce } from 'immer'
test('Integration test', async () => {
    // Create Node
    const {
        data: createdUserNode, 
        error: createUserNodeError
    } = await mergeSubgraph({
        nodeType: 'User',
        email: "dan.lannan@thinair.cloud2",
        '-ACCESS_TO->Organization': {
            'draft1':{
                'accessLevel': 'member',
                'ceo': 'Dan Lannan',
                'employees': 100,
                'name': 'Thin Air Computer LLC.',
                '<-BELONGS_TO-Project': {
                    'draft1': {
                        'name': 'Thin Air Infinite Canvas',
                    }
                }
            }, 
            'draft2':{
                'accessLevel': 'admin',
                ceo: 'Sam Hogan',
                employees: 200,
                name: 'Hirebird',
                '<-BELONGS_TO-Project': {
                    'draft1': {
                        'name': 'Mobile Application'
                    }
                }
            }
        },
        '<-SENT_BY-Message': {
            'draft1': {
                'contentType': 'text',
                'text': 'Hello, World!'
            }
        }
    } as const) 
    if (createUserNodeError) throwTestError(createUserNodeError)
    const {
        data: updatedUserNode, 
        error: updatedUserNodeError
    } = await mergeSubgraph(produce(createdUserNode, (draft) => {
        draft.firstName = 'Danielson'
    }))

    if (updatedUserNodeError) throwTestError(updatedUserNodeError)
    await writeFile('tests/merge:data.json', JSON.stringify(updatedUserNode, null, 2))

    // Test Extraction
    const {data: extractedUser, error: extactUserError} = await extractSubgraph({
        nodeType: 'User',
        email: 'dan.lannan@thinair.cloud2'
    }, (subgraph) => subgraph
        .extendPath('User', '-ACCESS_TO->Organization')
    )    
    if (extactUserError) throwTestError(extactUserError)
    await writeFile('tests/merge:extractedUser.json', JSON.stringify(extractedUser, null, 2))
    // await writeFile('tests/mergev2:queryString.cypher', userNodeA!)
})