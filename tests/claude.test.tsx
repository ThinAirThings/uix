import { expect, test, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { useEffect } from 'react'
import { renderHook, waitFor, act } from "@testing-library/react";
import { useSubgraph } from './testhooks/useSubgraphv4';
import { useMerge } from './testhooks/useMerge';
import {RelationshipState, SubgraphDefinition, SubgraphPathDefinition} from "@thinairthings/uix"
import { nodeDefinitionMap, OrganizationNode, OrganizationNodeState } from './uix/generated/staticObjects';
import {v4 as uuid} from 'uuid'
// @vitest-environment jsdom
import { enableMapSet } from 'immer';
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
    const { result: subgraphResult } = renderHook(() => useSubgraph({    
        'nodeType': 'User',
        'email': 'dan.lannan@thinair.cloud'
    }, subgraphDefinition), { wrapper });

    await waitFor(() => expect(subgraphResult.current.isSuccess).toBe(true));
    const { result, rerender } = renderHook(() => {
        const { subgraph } = useSubgraph({    
            'nodeType': 'User',
            'email': 'dan.lannan@thinair.cloud'
        }, subgraphDefinition)
        console.log("Line 49")
        const { draft, updateDraft, save, isSaving } = useMerge(subgraph!)
        return { subgraph, draft, updateDraft, save, isSaving }
    }, { wrapper })
    // Create Next States
    const nextFirstName = uuid()
    const initialOrganizationLength = result.current.draft['-ACCESS_TO->Organization']!.length
    const nextOrganization: OrganizationNodeState&RelationshipState<(typeof nodeDefinitionMap['User']['relationshipDefinitionSet'][number]&{type: 'ACCESS_TO'})> = {
        employees: 300,
        'name': uuid(),
        'ceo': uuid(),
        accessLevel: 'member',
    }
    // Perform update
    act(() => {
        result.current.updateDraft(draft => {
            draft.firstName = nextFirstName
            draft['-ACCESS_TO->Organization']?.push(nextOrganization)
        })
    })
    // Check if the cache was updated correctly
    expect(result.current.draft!.firstName).toBe(nextFirstName)
    expect(result.current.draft!['-ACCESS_TO->Organization']!.length).toBe(initialOrganizationLength + 1)
    act(() => {
        result.current.save()
    })
    // // Check optimistic update
    rerender()  // Rerender to get the latest state from the cache after calling save
    // Wait for the mutation to complete
    await waitFor(() => expect(result.current.isSaving).toBe(false));

    // console.log(JSON.stringify(result.current.draft, null, 2))
    // Check if the cache was updated correctly
    expect(result.current.subgraph!.firstName).toBe(nextFirstName)
    expect(result.current.subgraph!['-ACCESS_TO->Organization']!.length).toBe(initialOrganizationLength + 1)
})