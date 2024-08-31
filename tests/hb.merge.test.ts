import { test } from 'vitest'
import { extractSubgraph, mergeSubgraph } from './uix/generated/functionModule'
import { throwTestError } from './utils/throwTestError'
import { BELONGS_TO_Company_Relationship, JobNode, nodeDefinitionMap, UserNode } from './uix/generated/staticObjects'


test('Integration test', async () => {
    // Create Node
    console.log(JSON.stringify(nodeDefinitionMap.User.uniqueIndexes, null, 2))
    const {
        data: jobs, error: jobsError
    } = await mergeSubgraph({
        nodeType: 'Company',
        name: 'Hirebird',
        'delete': true,
        '<-BELONGS_TO-Job': {
            'someNodeId': {
                'title': 'Software Engineer',
                'description': 'Job description',
                'companyName': 'Hirebird'
            }
        }
        // '<-BELONGS_TO-Job': {
        //     ...(() => {
        //         return Object.fromEntries(Array.from({length: }, (_, i) => [
        //             `draft${i}`, {
        //                 'title': `Job ${i}`,
        //                 companyName: 'Hirebird',
        //                 'description': 'Job description'
        //             }
        //     ]))})()
        // }
    })
    if (jobsError) throwTestError(jobsError)
    console.log(JSON.stringify(jobs, null, 2))
    const {
        data: createdUserNode, 
        error: createUserNodeError
    } = await mergeSubgraph({
        nodeType: 'User',
        email: "root@hirebird.com",
        '-BELONGS_TO->Company': {
            'draft1': {
                'accessLevel': 'member',
                'name': 'Hirebird',
                '<-BELONGS_TO-User': {
                    ...(() => {
                        return Object.fromEntries(Array.from({length: 45}, (_, i) => [
                            `draft${i}`, {
                                'email': `user${i}@hirebird.com`,
                                'accessLevel': 'member' as const,
                                '-SWIPED_ON->Job': Object.fromEntries(Object.entries(jobs['<-BELONGS_TO-Job']!).slice(i, i+3))
                            } as UserNode&BELONGS_TO_Company_Relationship&{'-SWIPED_ON->Job': {
                                [id: string]: JobNode
                            }}
                        ]))
                    })(),
                }
            }, 
        },
        '<-SENT_BY-Message': {
            'draft1': {
                text: 'Hello, world!'
            }
        }
    } as const) 
    if (createUserNodeError) throwTestError(createUserNodeError)
})
