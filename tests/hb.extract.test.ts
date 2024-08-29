

import { test } from 'vitest'
import { extractSubgraph } from './uix/generated/functionModule'
import { throwTestError } from './utils/throwTestError'
import { BELONGS_TO_Company_Relationship, JobNode, nodeDefinitionMap, UserNode } from './uix/generated/staticObjects'

test('Integration test', async () => {
    // Create Node
    const {
        data: jobs, error: jobsError
    } = await extractSubgraph({
        'nodeType': 'User',
        'email': 'dan.lannan@thinair.cloud',
    }, 
        sg => sg
        .extendPath('User', '-SWIPED_ON->Job')
        // .extendPath('User-BELONGS_TO->Company', '<-BELONGS_TO-Job')
        // .extendPath('User-BELONGS_TO->Company<-BELONGS_TO-Job', '<-SWIPED_ON-User')
        // .extendPath('User-BELONGS_TO->Company<-BELONGS_TO-Project', '-BELONGS_TO->Company')
        // .extendPath('User-BELONGS_TO->Company<-BELONGS_TO-Job<-SWIPED_ON-User-BELONGS_TO->Company', '<-BELONGS_TO-User')
        // .extendPath('User', '<-SENT_BY-Message')
    )
    if (jobsError) throwTestError(jobsError)
    console.log(JSON.stringify(jobs, null, 2))
})