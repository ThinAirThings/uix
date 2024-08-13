import { expect, test } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { useEffect } from 'react'
import {RelationshipState, SubgraphDefinition, SubgraphPathDefinition,} from "@thinairthings/uix"
import {  nodeDefinitionMap, OrganizationNode, OrganizationNodeState } from './uix/generated/staticObjects';
import { enableMapSet } from 'immer';
import { mergeSubgraph } from './uix/generated/functionModule';
import {throwTestError} from './utils/throwTestError'
import { renderUseUix } from './utils/renderUseUix'
import { waitFor } from '@testing-library/dom';
import { writeFileSync } from 'fs';
// @vitest-environment jsdom
enableMapSet()

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: Infinity,
            },
        },
    })
    return ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
}

const subgraphDefinition = (subgraph: SubgraphDefinition<typeof nodeDefinitionMap, [SubgraphPathDefinition<
    typeof nodeDefinitionMap,
    "User",
    []
>]>) => subgraph
    .extendPath('User', '-ACCESS_TO->Organization')
    .extendPath('User-ACCESS_TO->Organization', '<-BELONGS_TO-Project')
    .extendPath('User-ACCESS_TO->Organization<-BELONGS_TO-Project', '<-ACCESS_TO-User')
    .extendPath('User', '<-CONVERSATION_BETWEEN-Chat')
    .extendPath('User<-CONVERSATION_BETWEEN-Chat', '-CONVERSATION_BETWEEN->User')

test('Create and update user test', async () => {
    const wrapper = createWrapper()
    // Create a new user
    const {data: userNode, error: createUserNodeError} = await mergeSubgraph({
        nodeType: 'User',
        email: 'dan.lannan@thinair.cloud',
        '-ACCESS_TO->Organization': {
            'draft1': {
                'accessLevel': 'admin',
                'ceo': 'Dan',
                'name': 'Thin Air',
                employees: 200,
            }
        }
    })
    if (createUserNodeError) throwTestError(createUserNodeError)
    expect(userNode?.email).toBe('dan.lannan@thinair.cloud')
    // Get Data
    const {result: userNodeSubgraph, updateDraft, rerender} = await renderUseUix({
        rootNodeIndex: userNode,
        defineSubgraph: subgraphDefinition
    }, wrapper )
    expect(userNodeSubgraph.current.draft!.email).toBe('dan.lannan@thinair.cloud')
    await updateDraft(draft => {
        draft.firstName = 'Daniel'
        draft.lastName = 'Lannan'
    })
    expect(userNodeSubgraph.current.data!.firstName).toBe('Daniel')
    expect(userNodeSubgraph.current.data!.lastName).toBe('Lannan')

})

test('Create and update organization test', async () => {
    const wrapper = createWrapper()
    const {result, updateDraft, rerender} = await renderUseUix({
        rootNodeIndex: {
            nodeType: 'User',
            email: "dan.lannan@thinair.cloud"
        },
        defineSubgraph: sg => sg
            .extendPath('User', '-ACCESS_TO->Organization')
            .extendPath('User-ACCESS_TO->Organization', '<-BELONGS_TO-Project'),
        initializeDraft: (data, define) => define({
            ...data,
            ["-ACCESS_TO->Organization"]: {
                draft1: {
                    name: '',
                    ceo: '',
                    employees: 200,
                    accessLevel: 'admin',
                    '<-BELONGS_TO-Project': {
                        'draft1': {
                            'name': 'Project 1',
                        }
                    }
                }
            }
        })
    }, wrapper)
    // Check for nested error handling
    await updateDraft(draft => {
        draft['-ACCESS_TO->Organization']!['draft1'].name = ''
    })
    await waitFor(() => Object.keys(expect(result.current.draftErrors)).length > 0, {timeout: 3000, interval: 1000})
    console.log("Draft Errors", result.current.draftErrors)
    expect(result.current.draftErrors['-ACCESS_TO->Organization']?.draft1?.name).toBe('Please enter your organization')
    
    const orgName = 'Thin Air1' 
    rerender()
    // Update organization
    await updateDraft(draft => {
        draft['-ACCESS_TO->Organization']['draft1'].name = orgName
        draft['-ACCESS_TO->Organization']['draft1'].ceo = 'Dan'
    })
    await waitFor(() => expect(result.current.isCommitSuccessful).toBe(true), {timeout: 3000, interval: 1000})
    console.log("OUTPUT", result.current.data?.['-ACCESS_TO->Organization'])
    const orgNodeId = Object.keys(result.current.data?.['-ACCESS_TO->Organization'] || {})[0]
    const {result: orgResult, updateDraft: orgUpdateDraft} = await renderUseUix({
        rootNodeIndex: {
            nodeType: 'Organization',
            nodeId: orgNodeId
        },
        defineSubgraph: sg => sg
            .extendPath('Organization', '<-BELONGS_TO-Project'),
        initializeDraft: (data, define) => define({
            ...data,
            '<-BELONGS_TO-Project': {
                [Object.values(result.current.data!['-ACCESS_TO->Organization']![orgNodeId]!['<-BELONGS_TO-Project']!).find(project => project.name === 'Project 1')!.nodeId]: {
                    'detach': true,
                    'name': 'Project 1'
                }
            }
        })

    }, wrapper)
    console.log("Node Id", orgNodeId)
    // Delete Organization
    await orgUpdateDraft(draft => {
    })
    // await waitFor(() => expect(orgResult.current.isCommitSuccessful).toBe(true), {timeout: 3000, interval: 1000})
    // console.log("OUTPUT", result.current.data?.['-ACCESS_TO->Organization'])
    // expect(result.current.data?.['-ACCESS_TO->Organization']?.[orgName].name).toBe(orgName)
})

// test('Test wraparound relationship case', async () => {
//     // Create a new user
//     const { data: userNode, error: createUserNodeError } = await mergeSubgraph({
//         nodeType: 'User',
//         email: 'root@root.com',
//         '-ACCESS_TO->Organization': {
//             'draft1': {
//                 'name': "hirebird",
//                 'ceo': 'sam',
//                 'employees': 200,
//                 'accessLevel': 'admin',
//                 '<-ACCESS_TO-User': {
//                     'draft1': { 'email': "L1_childA@L1.com", accessLevel: 'admin' },
//                     'draft2': { 'email': "L2_childA@L2.com", accessLevel: 'admin' },
//                     'draft3': { 'email': "L3_childA@L3.com", accessLevel: 'admin' },
//                     'draft4': { 'email': "L4_childA@L4.com", accessLevel: 'admin' },
//                     'draft5': { 'email': "L4_childB@L4.com", accessLevel: 'admin' },
//                     'draft6': { 'email': "L3_childB@L3.com", accessLevel: 'admin' },
//                     'draft7': { 'email': "L2_childB@L2.com", accessLevel: 'admin' },
//                     'draft8': { 'email': "L3_childC@L3.com", accessLevel: 'admin' },
//                     'draft9': { 'email': "L1_childB@L1.com", accessLevel: 'admin' },
//                     'draft10': { 'email': "L2_childC@L2.com", accessLevel: 'admin' },
//                     'draft11': { 'email': "L3_childD@L3.com", accessLevel: 'admin' },
//                     'draft12': { 'email': "L3_childE@L3.com", accessLevel: 'admin' },
//                     'draft13': { 'email': "L4_childC@L4.com", accessLevel: 'admin' },
//                 }
//             }
//         },
//         '-SUPERVISOR_TO->User': {
//             'draft1': {
//                 'email': "L1_childA@L1.com",
//                 '-SUPERVISOR_TO->User': {
//                     'draft1': {
//                         'email': "L2_childA@L2.com",
//                         '-SUPERVISOR_TO->User': {
//                             'draft1': {
//                                 'email': "L3_childA@L3.com",
//                                 '-SUPERVISOR_TO->User': {
//                                     'draft1': {
//                                         'email': "L4_childA@L4.com",
//                                     },
//                                     'draft2': {
//                                         'email': "L4_childB@L4.com",
//                                     }
//                                 }
//                             },
//                             'draft2': {
//                                 'email': "L3_childB@L3.com",
//                             }
//                         }
//                     },
//                     'draft2': {
//                         'email': "L2_childB@L2.com",
//                         '-SUPERVISOR_TO->User': {
//                             'draft1': {
//                                 'email': "L3_childC@L3.com",
//                             }
//                         }
//                     }
//                 }
//             },
//             'draft2': {
//                 'email': "L1_childB@L1.com",
//                 '-SUPERVISOR_TO->User': {
//                     'draft1': {
//                         'email': "L2_childC@L2.com",
//                         '-SUPERVISOR_TO->User': {
//                             'draft1': {
//                                 'email': "L3_childD@L3.com",
//                             },
//                             'draft2': {
//                                 'email': "L3_childE@L3.com",
//                                 '-SUPERVISOR_TO->User': {
//                                     'draft1': {
//                                         'email': "L4_childC@L4.com",
//                                     }
//                                 }
//                             }
//                         }
//                     }
//                 }
//             }
//         }
//     })
//     if (createUserNodeError) throwTestError(createUserNodeError)
//     const wrapper = createWrapper()
//     const {result: orgResult, updateDraft: orgUpdateDraft} = await renderUseUix({
//         rootNodeIndex: userNode,
//         defineSubgraph: sg => sg
//             .extendPath('User', '-ACCESS_TO->Organization')
//             .extendPath('User-ACCESS_TO->Organization', '<-ACCESS_TO-User')
//             .extendPath('User-ACCESS_TO->Organization<-ACCESS_TO-User', '-SUPERVISOR_TO->User')
//             .extendPath('User-ACCESS_TO->Organization<-ACCESS_TO-User-SUPERVISOR_TO->User', '-SUPERVISOR_TO->User')
//     }, wrapper)
//     writeFileSync("tests/hierarchy.json", JSON.stringify(orgResult.current.data, null, 2))
// })