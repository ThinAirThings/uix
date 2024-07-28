
import {  expect, test } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { useState } from 'react'
import { renderHook, waitFor } from "@testing-library/react";
import { convertToUixNode, UixNode, useSubgraph } from './testhooks/useSubgraph';
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
        // selector: (subgraph) => subgraph.email
    }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const initialUixSubgraph = convertToUixNode(result.current.subgraph!, result.current.subgraph!)
    console.log(JSON.stringify(result.current.subgraph, null, 2))
    queryClient.setQueryData([{
        nodeType: 'User',
        referenceType: 'nodeIndex',
        indexKey: 'email',
        indexValue: 'userA@test.com'
    }], () => produce(result.current.subgraph!, draft => {
        // draft['-ACCESS_TO->Organization'][0].ceo = 'Bobothy'
        draft['-ACCESS_TO->Organization'][0]['<-BELONGS_TO-Project'][0].name = 'Project A'
        // draft.email = 'userAA@test.com'
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
        // selector: (subgraph) => subgraph.email
    }), { wrapper });
    console.log("ABOVE: Result1 Name", result.current.subgraph!['-ACCESS_TO->Organization'][0]['<-BELONGS_TO-Project'][0].name)
    console.log("ABOVE: Result2 Name", result2.current.subgraph!['-ACCESS_TO->Organization'][0]['<-BELONGS_TO-Project'][0].name)
    // console.log(Object.keys(initialUixSubgraph))
    const uixSubgraph = convertToUixNode(result.current.subgraph!, result2.current.subgraph!, initialUixSubgraph)
    // Check Uix Node References
    console.log("IS EQUAL REFERENCE RootUixNode", initialUixSubgraph === uixSubgraph)
    console.log("IS EQUAL REFERENCE Path 1-Depth 1 NestedUixNode", initialUixSubgraph['-ACCESS_TO->Organization'][0] === uixSubgraph['-ACCESS_TO->Organization'][0])
    console.log("IS EQUAL REFERENCE Path 1-Depth 2", initialUixSubgraph['-ACCESS_TO->Organization'][0]['<-BELONGS_TO-Project'][0] === uixSubgraph['-ACCESS_TO->Organization'][0]['<-BELONGS_TO-Project'][0])
    console.log("IS EQUAL REFERENCE Path 2-Depth 1 NestedUixNode", initialUixSubgraph['-ACCESS_TO->Organization'][1] === uixSubgraph['-ACCESS_TO->Organization'][1])
    console.log("----------")
    // Check Data Node Reference
    console.log("IS EQUAL REFERENCE Root", result2.current.subgraph === result.current.subgraph)
    console.log("IS EQUAL REFERENCE Path 1-Depth 1 Nested", result2.current.subgraph?.['-ACCESS_TO->Organization'][0] === result.current.subgraph?.['-ACCESS_TO->Organization'][0])
    console.log("IS EQUAL REFERENCE Path 1-Depth 2", result2.current.subgraph?.['-ACCESS_TO->Organization'][0]['<-BELONGS_TO-Project'][0] === result.current.subgraph?.['-ACCESS_TO->Organization'][0]['<-BELONGS_TO-Project'][0])
    console.log("IS EQUAL REFERENCE Path 2-Depth 1", result2.current.subgraph?.['-ACCESS_TO->Organization'][1] === result.current.subgraph?.['-ACCESS_TO->Organization'][1])
    
    await waitFor(() => expect(result2.current.isSuccess).toBe(true));
    console.log("BELOW: Result1 Name", result.current.subgraph!['-ACCESS_TO->Organization'][0]['<-BELONGS_TO-Project'][0].name)
    console.log("BELOW: Result2 Name", result2.current.subgraph!['-ACCESS_TO->Organization'][0]['<-BELONGS_TO-Project'][0].name)
    const uixSubgraph2 = convertToUixNode(result.current.subgraph!, result2.current.subgraph!, uixSubgraph)
    // Check Uix Node References
    console.log("IS EQUAL REFERENCE RootUixNode", uixSubgraph2 === uixSubgraph)
    console.log("IS EQUAL REFERENCE Path 1-Depth 1 NestedUixNode", uixSubgraph2['-ACCESS_TO->Organization'][0] === uixSubgraph['-ACCESS_TO->Organization'][0])
    console.log("IS EQUAL REFERENCE Path 1-Depth 2", uixSubgraph2['-ACCESS_TO->Organization'][0]['<-BELONGS_TO-Project'][0] === uixSubgraph['-ACCESS_TO->Organization'][0]['<-BELONGS_TO-Project'][0])
    console.log("IS EQUAL REFERENCE Path 2-Depth 1 NestedUixNode", uixSubgraph2['-ACCESS_TO->Organization'][1] === uixSubgraph['-ACCESS_TO->Organization'][1])
    console.log("----------")
    // Check Data Node Reference
    console.log("IS EQUAL REFERENCE Root", result2.current.subgraph === result.current.subgraph)
    console.log("IS EQUAL REFERENCE Path 1-Depth 1 Nested", result2.current.subgraph?.['-ACCESS_TO->Organization'][0] === result.current.subgraph?.['-ACCESS_TO->Organization'][0])
    console.log("IS EQUAL REFERENCE Path 1-Depth 2", result2.current.subgraph?.['-ACCESS_TO->Organization'][0]['<-BELONGS_TO-Project'][0] === result.current.subgraph?.['-ACCESS_TO->Organization'][0]['<-BELONGS_TO-Project'][0])
    console.log("IS EQUAL REFERENCE Path 2-Depth 1", result2.current.subgraph?.['-ACCESS_TO->Organization'][1] === result.current.subgraph?.['-ACCESS_TO->Organization'][1])
    expect(result.current.subgraph).toBeDefined()
})
