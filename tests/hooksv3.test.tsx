
import {  expect, test } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { useEffect } from 'react'
import { renderHook, waitFor } from "@testing-library/react";
import { useSubgraph } from './testhooks/useSubgraphv4';
import { useMerge } from './testhooks/useMerge';
// @vitest-environment jsdom
test('Query path test', async () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: Infinity,
            },
        },
    })
    const wrapper = ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const runSubgraphHook = () => renderHook(() => useSubgraph({    
        'nodeType': 'User',
        'email': 'dan.lannan@thinair.cloud'
    }, (subgraph) => subgraph
        .extendPath('User', '-ACCESS_TO->Organization')
        .extendPath('User-ACCESS_TO->Organization', '<-BELONGS_TO-Project')
        .extendPath('User-ACCESS_TO->Organization<-BELONGS_TO-Project', '<-ACCESS_TO-User')
        .extendPath('User', '<-CONVERSATION_BETWEEN-Chat')
        .extendPath('User<-CONVERSATION_BETWEEN-Chat', '-CONVERSATION_BETWEEN->User'))
    , { wrapper });
    const { result: subgraphResult } = runSubgraphHook()
    await waitFor(() => expect(subgraphResult.current.isSuccess).toBe(true));
    const {result} = renderHook(() => {
        const {subgraph} = useSubgraph({    
            'nodeType': 'User',
            'email': 'dan.lannan@thinair.cloud'
        }, (subgraph) => subgraph
            .extendPath('User', '-ACCESS_TO->Organization')
            .extendPath('User-ACCESS_TO->Organization', '<-BELONGS_TO-Project')
            .extendPath('User-ACCESS_TO->Organization<-BELONGS_TO-Project', '<-ACCESS_TO-User')
            .extendPath('User', '<-CONVERSATION_BETWEEN-Chat')
            .extendPath('User<-CONVERSATION_BETWEEN-Chat', '-CONVERSATION_BETWEEN->User')
        )
        const {draft, updateDraft, save, isSaving} = useMerge(subgraph!['-ACCESS_TO->Organization']![0])
        useEffect(() => {
            // Update Node
            updateDraft(draft => {
                draft['-ACCESS_TO->Organization']![0].ceo = 'Bobothy'
                draft['-ACCESS_TO->Organization']![0].accessLevel = 'member'
                draft['-ACCESS_TO->Organization']?.push({
                    employees: 300,
                    accessLevel: 'member',
                    ceo: 'Dick Willis',
                    name: 'Bandana',
                })
            })
            save()
        }, [])
        return {draft, isSaving}
    }, { wrapper })
    await waitFor(() => expect(result.current.isSaving).toBe(false));
    expect(result.current.draft['-ACCESS_TO->Organization']![0].ceo).toBe('Bobothy')
})