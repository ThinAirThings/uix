import { test } from "vitest";
import { useUix } from "./uix/generated/useUix";
import React, { forwardRef, useEffect, useImperativeHandle } from 'react'
import { mergeSubgraph } from "./uix/generated/functionModule";
import {UixProvider} from './uix/generated/UixProvider'
import { act, render, renderHook } from "@testing-library/react";
import { setTimeout } from "timers/promises";
// @vitest-environment jsdom

type UpdateDraftRef = {
    draft: ReturnType<typeof useUix<'User', any, any>>['draft']
    updateDraft: ReturnType<typeof useUix<'User', any, any>>['updateDraft']
    commit: ReturnType<typeof useUix<'User', any, any>>['commit']
    
}
const MyComponent = forwardRef<UpdateDraftRef, {}>((_, ref) => {
    const {data: userNode, draft, updateDraft, commit, isPending, draftDidChange, draftErrors, resetDraft, isCommitError, isCommitPending, isCommitSuccessful} = useUix({
        rootNodeIndex: {
            nodeType: 'User',
            email: 'dan.lannan@thinair.cloud'
        },
        initializeDraft: draft => ({
            ...draft,
        })
    })
    useImperativeHandle(ref, () => ({
        draft,
        updateDraft,
        commit
    }), [updateDraft])
    useEffect(() => {console.log("Render from userNode")}, [userNode])
    useEffect(() => {console.log("Render from draft")}, [draft])
    useEffect(() => {console.log("Render from updateDraft")}, [updateDraft])
    useEffect(() => {console.log("Render from commit")}, [commit])
    useEffect(() => {console.log("Render from isPending")}, [isPending])
    useEffect(() => {console.log("Render from draftDidChange")}, [draftDidChange])
    useEffect(() => {console.log("Render from draftErrors")}, [draftErrors])
    useEffect(() => {console.log("Render from resetDraft")}, [resetDraft])
    useEffect(() => {console.log("Render from isCommitError")}, [isCommitError])
    useEffect(() => {console.log("Render from isCommitPending")}, [isCommitPending])
    useEffect(() => {console.log("Render from isCommitSuccessful")}, [isCommitSuccessful])

    console.log("Actual:", userNode)
    console.log("Draft:", draft)
    return (<></>)
})

test('Test Render Cycles', async () => {
    await mergeSubgraph({
        nodeType: 'User',
        email: 'dan.lannan@thinair.cloud',
        firstName: ''
    })
    let renderCount = 0
    const ref = React.createRef<UpdateDraftRef>()
    const TestComponent = () => {
        return <MyComponent ref={ref}/>
    }
    const {rerender, getByText} = render(<TestComponent/>, {
        wrapper: UixProvider
    })
    await setTimeout(1000)
    await act(async () => {
        console.log("Calling updateDraft")
        ref.current?.updateDraft(draft => {
            draft.firstName = 'Dan'
        })
    }) 
    await act(async () => {
        console.log("Calling commitDraft")
        ref.current?.commit(ref.current!.draft!)
    }) 
    await setTimeout(1000)
})