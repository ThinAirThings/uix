import { expect, test } from 'vitest'
import { extractSubgraph } from './uix/generated/functionModule'


test('Query path and optimistic update test', async () => {
    // Create a new user
    const {data: userNode, error: createUserNodeError} = await extractSubgraph({
        nodeType: 'User',
        email: 'dan.lannan@thinair.cloud'
    }, (sg) => sg
        .extendPath('User', '-ACCESS_TO->Organization')
        .extendPath('User-ACCESS_TO->Organization', '<-BELONGS_TO-Project')
    )
    // Convert to Map
    // const objectToMap
})