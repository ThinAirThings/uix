
import {  test } from 'vitest'
import { 
    NextNodeTypeFromPath, 
    PreviousNodeTypeFromPath
} from "@thinairthings/uix"
import { extractSubgraph } from './uix/generated/functionModule'
import { nodeDefinitionMap } from './uix/generated/staticObjects'
import { writeFileSync } from 'fs'
import { throwTestError } from './utils/throwTestError'

test('Query path test', async () => {
    const {data: subgraph, error: subgraphError} = await extractSubgraph({
            'nodeType': 'User',
            'email': 'dan.lannan@thinair.cloud'
        }, (subgraph) => subgraph
        .extendPath('User', '-SWIPED_ON->Job')
    )
    writeFileSync('tests/extract:output.json', JSON.stringify(subgraph, null, 2))
    if (subgraphError) throwTestError(subgraphError)    
})

