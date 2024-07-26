
import {  expect, test } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { useState } from 'react'
import { renderHook, waitFor } from "@testing-library/react";
import { useSubgraph } from './testhooks/useSubgraph';
import { produce } from 'immer';
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
    const { result } = renderHook(() => useSubgraph({
        nodeType: 'User',
        referenceType: 'nodeIndex',
        indexKey: 'email',
        indexValue: 'userA@test.com',
        subgraphSelector: (subgraph) => subgraph
            .addNode('-ACCESS_TO->Organization')
            .addNode('<-BELONGS_TO-Project')
            .root()
            .addNode('<-SENT_BY-Message'),
        // selector: (data) => data.email
    }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    queryClient.setQueryData([{
        nodeType: 'User',
        referenceType: 'nodeIndex',
        indexKey: 'email',
        indexValue: 'userA@test.com'
    }], () => produce(result.current.data!, draft => {
        draft['-ACCESS_TO->Organization'][0].ceo = 'Bobothy'
        draft.email = 'userAA@test.com'
    }))
    // queryClient.invalidateQueries({
    //     queryKey: [{
    //     nodeType: 'User',
    //     referenceType: 'nodeIndex',
    //     indexKey: 'email',
    //     indexValue: 'userA@test.com'
    // }]})

    const { result: result2 } = renderHook(() => useSubgraph({
        nodeType: 'User',
        referenceType: 'nodeIndex',
        indexKey: 'email',
        indexValue: 'userA@test.com',
        subgraphSelector: (subgraph) => subgraph
            .addNode('-ACCESS_TO->Organization')
            .addNode('<-BELONGS_TO-Project')
            .root()
            .addNode('<-SENT_BY-Message'),
        // selector: (data) => data.email
    }), { wrapper });
    console.log("IS EQUAL REFERENCE", result2.current.data?.['-ACCESS_TO->Organization'][0]['<-BELONGS_TO-Project'][0] === result.current.data?.['-ACCESS_TO->Organization'][0]['<-BELONGS_TO-Project'][0])
    await waitFor(() => expect(result2.current.isSuccess).toBe(true));
    console.log("IS EQUAL REFERENCE", result2.current.data === result.current.data)
    expect(result.current.data).toBeDefined()
})

