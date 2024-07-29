import { test } from 'vitest'
import { mergeSubgraph } from './uix/generated/functionModule'
import { throwTestError } from './utils/throwTestError'
import { writeFile } from 'fs/promises'
test('Integration test', async () => {
    // Create Node
    const {
        data: createdUserNode, 
        error: createUserNodeError
    } = await mergeSubgraph({
        nodeType: 'User',
        email: "dan.lannan@thinair.cloud",
        '-ACCESS_TO->Organization': [{
            'accessLevel': 'owner',
            'ceo': 'Dan Lannan',
            'employees': 100,
            'name': 'Thin Air Computer LLC.',
            '<-BELONGS_TO-Project': [{
                'name': 'Thin Air Infinite Canvas',
            }]
        }, {
            'accessLevel': 'admin',
            ceo: 'Sam Hogan',
            employees: 200,
            name: 'Hirebird',
            '<-BELONGS_TO-Project': [{
                'name': 'Mobile Application'
            }]
        }],
        '<-SENT_BY-Message': [{
            'contentType': 'text',
            'text': 'Hello, World!'
        }]
    }) 
    if (createUserNodeError) throwTestError(createUserNodeError)
    const {
        data: updatedUserNode, 
        error: updatedUserNodeError
    } = await mergeSubgraph(createdUserNode, (draft) => {
        draft['-ACCESS_TO->Organization'][0].employees = 10000
    })

    if (updatedUserNodeError) throwTestError(updatedUserNodeError)
    await writeFile('tests/mergev2:data.json', JSON.stringify(updatedUserNode, null, 2))
    // await writeFile('tests/mergev2:queryString.cypher', userNodeA!)
})