import { expect, test } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { useEffect } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import {RelationshipState, SubgraphDefinition, SubgraphPathDefinition,} from "@thinairthings/uix"
import { ConfiguredNodeDefinitionMap, nodeDefinitionMap, OrganizationNode, OrganizationNodeState } from './uix/generated/staticObjects';
import {v4 as uuid} from 'uuid'
// @vitest-environment jsdom
import { enableMapSet } from 'immer';
import { mergeSubgraph } from './uix/generated/functionModule';
import {throwTestError} from './utils/throwTestError'
import { useSubgraph } from './uix/generated/_useSubgraph'
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

test('Query path and optimistic update test', async () => {
    const wrapper = createWrapper()
    // nodeDefinitionMap.User.relationshipDefinitionMap['ACCESS_TO'].strength
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
    const {result: userNodeSubgraph, rerender} = renderHook(() => useSubgraph(userNode, {
        defineSubgraph: subgraphDefinition
    }), { wrapper })
    await waitFor(() => {expect(userNodeSubgraph.current.isSuccess).toBe(true)}, {timeout: 3000, interval: 1000})
    expect(userNodeSubgraph.current.draft!.email).toBe('dan.lannan@thinair.cloud')
    act(() => {
        userNodeSubgraph.current.updateDraft(draft => {
            draft['-ACCESS_TO->Organization']
            draft.firstName = 'Dan'
            draft.lastName = 'Lannan'
        })
    })
    // act(() => {userNodeSubgraph.current.commitDraft()})
    // await waitFor(() => expect(userNodeSubgraph.current.isCommitSuccessful).toBe(true), {timeout: 3000, interval: 1000})
    // expect(userNodeSubgraph.current.subgraph!.firstName).toBe('Dan')
    // // Add Organization
    // act(() => {
    //     userNodeSubgraph.current.draft
    //     userNodeSubgraph.current.updateDraft(draft => {
    //         if (!draft) return
    //         draft['-ACCESS_TO->Organization'] = [{
    //             ceo: 'Dan',
    //             name: 'Thin Air',
    //             employees: 200,
    //             accessLevel: 'owner',
    //         }]
    //     })
    // })
    // act(() => {
    //     userNodeSubgraph.current.commitDraft()
    // })
    // rerender() // Required for isCommitSuccessful to be updated
    // await waitFor(() => expect(userNodeSubgraph.current.isCommitSuccessful).toBe(true), {timeout: 3000, interval: 1000})
    // expect(userNodeSubgraph.current.subgraph?.['-ACCESS_TO->Organization']?.[0].name).toBe('Thin Air')
    // // Add Project to organization
    // act(() => {
    //     userNodeSubgraph.current.updateDraft(draft => {
    //         if (!draft) return
    //         const org = draft['-ACCESS_TO->Organization']?.find(org => org.name === 'Thin Air')!
    //         org['<-BELONGS_TO-Project'] = [{
    //             name: 'Uix',
    //             description: 'Write uix'
    //         }]
    //     })
    // })
    // act(() => {
    //     userNodeSubgraph.current.commitDraft()
    // })
    // rerender() // Required for isCommitSuccessful to be updated
    // await waitFor(() => expect(userNodeSubgraph.current.isCommitSuccessful).toBe(true), {timeout: 3000, interval: 1000})
    // expect(userNodeSubgraph.current.subgraph?.['-ACCESS_TO->Organization']?.[0]['<-BELONGS_TO-Project']?.[0].name).toBe('Uix')
    // // Add Other Project to Organization
    // act(() => {
    //     userNodeSubgraph.current.updateDraft(draft => {
    //         if (!draft) return
    //         draft['-ACCESS_TO->Organization']?.find(org => org.name === 'Thin Air')!['<-BELONGS_TO-Project']?.push({
    //             name: 'Hirebird',
    //             description: 'Write Hirebird'
    //         })
    //     })
    // })
    // act(() => {
    //     userNodeSubgraph.current.commitDraft()
    // })
    // rerender() // Required for isCommitSuccessful to be updated
    // await waitFor(() => expect(userNodeSubgraph.current.isCommitSuccessful).toBe(true), {timeout: 3000, interval: 1000})
    // expect(userNodeSubgraph.current
    //     .subgraph?.['-ACCESS_TO->Organization']
    //     ?.find(org => org.name === 'Thin Air')
    //     ?.['<-BELONGS_TO-Project']?.find(project => project.name === 'Hirebird')?.name).toBe('Hirebird')
    // // Test Single Project Deletion
    // act(() => {
    //     userNodeSubgraph.current.updateDraft(draft => {
    //         if (!draft) return
    //         const projects = draft['-ACCESS_TO->Organization']?.find(org => org.name === 'Thin Air')?.['<-BELONGS_TO-Project']
    //         const projectIndex = projects?.findIndex(project => project.name === 'Uix')
    //         if (projectIndex !== undefined) projects?.splice(projectIndex, 1)
    //     })
    // })
    // act(() => {
    //     userNodeSubgraph.current.commitDraft()
    // })
    // rerender() // Required for isCommitSuccessful to be updated
    // await waitFor(() => expect(userNodeSubgraph.current.isCommitSuccessful).toBe(true), {timeout: 3000, interval: 1000})
    // expect(userNodeSubgraph.current
    //     .subgraph?.['-ACCESS_TO->Organization']
    //     ?.find(org => org.name === 'Thin Air')
    //     ?.['<-BELONGS_TO-Project']?.find(project => project.name === 'Uix')).toBe(undefined)
    // // Test Remove Self from Organization
    // act(() => {
    //     userNodeSubgraph.current.updateDraft(draft => {
    //         if (!draft) return
    //         const orgIndex = draft['-ACCESS_TO->Organization']?.findIndex(org => org.name === 'Thin Air')
    //         if (orgIndex !== undefined) draft['-ACCESS_TO->Organization']?.splice(orgIndex, 1)
    //     })
    // })
    // act(() => {
    //     userNodeSubgraph.current.commitDraft()
    // })
    // rerender() // Required for isCommitSuccessful to be updated
    // await waitFor(() => expect(userNodeSubgraph.current.isCommitSuccessful).toBe(true), {timeout: 3000, interval: 1000})
    // expect(userNodeSubgraph.current
    //     .subgraph?.['-ACCESS_TO->Organization']
    //     ?.find(org => org.name === 'Thin Air')).toBe(undefined)

    // const {result: organizationNodeResult} = renderHook(() => useSubgraph({
    //     'nodeType': 'Organization',
    //     'name': 'Thin Air'
    // }, {
    //     defineSubgraph: (subgraph) => subgraph.extendPath('Organization', '<-ACCESS_TO-User')
    // }), {wrapper}) 
    // await waitFor(() => expect(organizationNodeResult.current.isSuccess).toBe(true), {timeout: 3000, interval: 1000})
    // // Test Add User to Organization
    // act(() => {
    //     organizationNodeResult.current.updateDraft(draft => {
    //         if (!draft) return
    //         draft['<-ACCESS_TO-User'] = [{
    //             accessLevel: 'member',
    //             ...userNode
    //         }]
    //     })
    // })
    // act(() => {
    //     organizationNodeResult.current.commitDraft()
    // })
    // await waitFor(() => expect(organizationNodeResult.current.isCommitSuccessful).toBe(true), {timeout: 3000, interval: 1000})
    // expect(organizationNodeResult.current.subgraph?.['<-ACCESS_TO-User']?.[0].email).toBe('dan.lannan@thinair.cloud')
})