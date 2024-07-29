

import { execSync } from 'child_process'
import {  test } from 'vitest'
import { Err, tryCatch } from '../src/types/Result'
import { writeFile } from 'fs/promises'
import { SubgraphDefinition} from "@thinairthings/uix"
import { nodeDefinitionMap } from './uix/generated/staticObjects'
import { extractSubgraphv2 } from './uix/generated/functionModule'

test('Query path test', async () => {
    // const subgraphDefinition = new SubgraphDefinition(
    //     nodeDefinitionMap,
    //     [new SubgraphNodeDefinition('User', [])]
    // )
    //     .defineRelationship('User', '-ACCESS_TO->Organization')
    //     .defineRelationship('User', '<-SENT_BY-Message')
    //     .defineRelationship('Organization', '<-BELONGS_TO-Project')
    //     .defineRelationship('Message', '-SENT_IN->Chat')
    // const thing = subgraphDefinition.nodeDefinitionSet[0].nodeType
    // console.log(JSON.stringify(subgraphDefinition.nodeDefinitionSet, null, 2))
    const {data} = await extractSubgraphv2({
            'nodeType': 'User',
            'email': 'dan.lannan@thinair.cloud'
        }, (subgraph) => subgraph
        .defineRelationship('User', '-ACCESS_TO->Organization')
        .defineRelationship('Organization', '<-ACCESS_TO-User')
        .defineRelationship('Organization', '<-BELONGS_TO-Project')
    )
    console.log(data)
})

