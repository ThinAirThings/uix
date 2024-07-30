

import { execSync } from 'child_process'
import {  test } from 'vitest'
import { Err, tryCatch } from '../src/types/Result'
import { writeFile } from 'fs/promises'
import { 
    NextNodeTypeFromPath, 
    PreviousNodeTypeFromPath, 
    RelationshipUnion, 
    SubgraphDefinition
} from "@thinairthings/uix"
import { nodeDefinitionMap } from './uix/generated/staticObjects'
import { extractSubgraphv2 } from './uix/generated/functionModule'
import { writeFileSync } from 'fs'
import { throwTestError } from './utils/throwTestError'

test('Query path test', async () => {
    const {data: subgraph, error: subgraphError} = await extractSubgraphv2({
            'nodeType': 'User',
            'email': 'dan.lannan@thinair.cloud'
        }, (subgraph) => subgraph
        .extendPath('User', '-ACCESS_TO->Organization')
        .extendPath('User-ACCESS_TO->Organization', '<-BELONGS_TO-Project')
        .extendPath('User-ACCESS_TO->Organization<-BELONGS_TO-Project', '<-ACCESS_TO-User')
        .extendPath('User', '<-CONVERSATION_BETWEEN-Chat')
        .extendPath('User<-CONVERSATION_BETWEEN-Chat', '-CONVERSATION_BETWEEN->User')
    )
    writeFileSync('tests/extractv2:output.json', JSON.stringify(subgraph, null, 2))
    if (subgraphError) throwTestError(subgraphError)
    const thing1 = subgraph['-ACCESS_TO->Organization']?.map(node => {
        console.log(node)
        return node.ceo
    })
        
    // const thing2 = data!['<-CONVERSATION_BETWEEN-Chat'].map(node => node)
    //     .map(node => {
    //         node
    //         node['-CONVERSATION_BETWEEN->User']
    //         node['-CONVERSATION_BETWEEN->User'].map(node => node)
    //         return node['-CONVERSATION_BETWEEN->User'].map(node => node)
    //     })
    //     .map(node => node.map(node => node))
        
})

type Path1_Segment1 = 'User'
type Path1_Segment1Result = [
    PreviousNodeTypeFromPath<typeof nodeDefinitionMap, Path1_Segment1>,
    NextNodeTypeFromPath<typeof nodeDefinitionMap, Path1_Segment1>
]
type Path1_Segment2 = 'User-ACCESS_TO->Organization'
type Path1_Segment2Result = [
    PreviousNodeTypeFromPath<typeof nodeDefinitionMap,  Path1_Segment2>,
    NextNodeTypeFromPath<typeof nodeDefinitionMap, Path1_Segment2>
]
type Path1_Segment3 = 'User-ACCESS_TO->Organization<-BELONGS_TO-Project'
type Wrong = ["User-ACCESS_TO->Organization", "Project"]
type Path1_Segment3Result = [
    PreviousNodeTypeFromPath<typeof nodeDefinitionMap, Path1_Segment3>,
    NextNodeTypeFromPath<typeof nodeDefinitionMap, Path1_Segment3>
]
type Thing = Path1_Segment3Result[1]
type Path1_Segment4 = 'User-ACCESS_TO->Organization<-BELONGS_TO-Project'
type Path1_Segment4Result = [
    PreviousNodeTypeFromPath<typeof nodeDefinitionMap, Path1_Segment4>,
    NextNodeTypeFromPath<typeof nodeDefinitionMap, Path1_Segment4>
]

type Path2_Segment1 = 'User'
type Path2_Segment1Result = [
    PreviousNodeTypeFromPath<typeof nodeDefinitionMap, Path2_Segment1>,
    NextNodeTypeFromPath<typeof nodeDefinitionMap, Path2_Segment1>
]
type Path2_Segment2 = 'User<-CONVERSATION_BETWEEN-Chat'
type Path2_Segment2Result = [
    PreviousNodeTypeFromPath<typeof nodeDefinitionMap, Path2_Segment2>,
    NextNodeTypeFromPath<typeof nodeDefinitionMap, Path2_Segment2>
]
type Path2_Segment3 = 'User<-CONVERSATION_BETWEEN-Chat-CONVERSATION_BETWEEN->User'
type Path2_Segment3Result = [
    PreviousNodeTypeFromPath<typeof nodeDefinitionMap, Path2_Segment3>,
    NextNodeTypeFromPath<typeof nodeDefinitionMap, Path2_Segment3>
]
