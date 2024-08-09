import { expect, test } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { useEffect } from 'react'
import {RelationshipState, SubgraphDefinition, SubgraphPathDefinition,} from "@thinairthings/uix"
import { ConfiguredNodeDefinitionMap, nodeDefinitionMap, OrganizationNode, OrganizationNodeState } from './uix/generated/staticObjects';
// @vitest-environment jsdom
import { enableMapSet } from 'immer';
import { mergeSubgraph } from './uix/generated/functionModule';
import {throwTestError} from './utils/throwTestError'
import { renderUseUix } from './utils/renderUseUix'
import { waitFor } from '@testing-library/dom';
import exp from 'constants';
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
        defineSubgraph: sg => sg.extendPath('User', '-ACCESS_TO->Organization'),
        initializeDraft: (data, define) => define({
            ...data,
            ["-ACCESS_TO->Organization"]: {
                draft1: {
                    name: '',
                    ceo: 'Dan',
                    employees: 200,
                    accessLevel: 'admin'
                }
            }
        })
    }, wrapper)
    // Check for nested error handling
    await updateDraft(draft => {
        draft['-ACCESS_TO->Organization']['draft1'].name = ''
    })
    await waitFor(() => Object.keys(expect(result.current.draftErrors)).length > 0, {timeout: 3000, interval: 1000})
    expect(result.current.draftErrors['-ACCESS_TO->Organization'].draft1.name).toBe('Please enter your organization')
    
    const orgName = 'Thin Air1' 
    rerender()
    // Update organization
    await updateDraft(draft => {
        draft['-ACCESS_TO->Organization']['draft1'].name = orgName
    })

    await waitFor(() => expect(result.current.isCommitSuccessful).toBe(true), {timeout: 3000, interval: 1000})
    console.log("OUTPUT", result.current.data?.['-ACCESS_TO->Organization'])
    // expect(result.current.data?.['-ACCESS_TO->Organization']?.[orgName].name).toBe(orgName)
})