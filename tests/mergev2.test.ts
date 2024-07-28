import { execSync } from 'child_process'
import { test } from 'vitest'
import { Err, tryCatch } from '../src/types/Result'
import { extractSubgraph, mergeSubgraphv2, mergeSubgraphv3 } from './uix/generated/functionModule'
import { throwTestError } from './utils/throwTestError'
import { writeFile } from 'fs/promises'
test('Integration test', async () => {
    // Create Node
    const {
        data: createdUserNode, 
        error: createUserNodeError
    } = await mergeSubgraphv3({
        nodeType: 'User',
        email: "Dan",
        nodeId: 'Custom',
        '-ACCESS_TO->Organization': [{
            'accessLevel': 'member',
            'ceo': 'Bob Johnson',
            'employees': 100,
            'name': 'Ranger Solar',
        }],
    }) 
    if (createUserNodeError) throwTestError(createUserNodeError)
    const {
        data: updatedUserNode, 
        error: updatedUserNodeError
    } = await mergeSubgraphv3(createdUserNode, (draft) => {
        draft['-ACCESS_TO->Organization'][0].ceo = 'Bobothy'
    })

    if (updatedUserNodeError) throwTestError(updatedUserNodeError)
    await writeFile('tests/mergev2:data.json', JSON.stringify(updatedUserNode, null, 2))
    // await writeFile('tests/mergev2:queryString.cypher', userNodeA!)
})