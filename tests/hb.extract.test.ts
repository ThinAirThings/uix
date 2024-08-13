

import { test } from 'vitest'
import { extractSubgraph, extractSubgraphv2, mergeSubgraph } from './uix/generated/functionModule'
import { throwTestError } from './utils/throwTestError'
import { BELONGS_TO_Company_Relationship, JobNode, nodeDefinitionMap, UserNode } from './uix/generated/staticObjects'

test('Integration test', async () => {
    // Create Node
    const {
        data: jobs, error: jobsError
    } = await extractSubgraphv2({
        'nodeType': 'Company',
        'name': 'Hirebird',
    }, sg => sg
        .extendPath('Company', '<-BELONGS_TO-Job')
        .extendPath('Company<-BELONGS_TO-Job', '<-SWIPED_ON-User')
        // .extendPath('Company<-BELONGS_TO-Job<-SWIPED_ON-User', '-BELONGS_TO->Company')
        // .extendPath('Company<-BELONGS_TO-Job<-SWIPED_ON-User-BELONGS_TO->Company', '<-BELONGS_TO-User')
    )
    if (jobsError) throwTestError(jobsError)
    // console.log(JSON.stringify(jobs, null, 2))
})