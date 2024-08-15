import { expect, test } from "vitest";
import { useUix } from "./uix/generated/useUix";
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { mergeSubgraph } from "./uix/generated/functionModule";
import {UixProvider} from './uix/generated/UixProvider'
import { act, render, renderHook, waitFor } from "@testing-library/react";
import { setTimeout } from "timers/promises";
import {GenericNodeShape} from '@thinairthings/uix'
// @vitest-environment jsdom

type UpdateDraftRef = {
    draft: ReturnType<typeof useUix<'User', any, any>>['draft']
    updateDraft: ReturnType<typeof useUix<'User', any, any>>['updateDraft']
    commit: ReturnType<typeof useUix<'User', any, any>>['commit'],
    isCommitSuccessful: ReturnType<typeof useUix<'User', any, any>>['isCommitSuccessful'],
    nodeToDelete: GenericNodeShape
}
const MyComponent = forwardRef<UpdateDraftRef, {}>((_, ref) => {
    const {data: userNode, draft, updateDraft, commit, isPending, draftDidChange, draftErrors, resetDraft, isCommitError, isCommitPending, isCommitSuccessful} = useUix({
        rootNodeIndex: {
            nodeType: 'User',
            email: 'dan.lannan@thinair.cloud'
        },
        defineSubgraph: sg => sg.extendPath('User', '-SWIPED_ON->Job'),
        initializeDraft: draft => ({
            ...draft,
        })
    })
    const nodeToDeleteRef = useRef<GenericNodeShape>()
    useEffect(() => {
        if (userNode) {
            if (!userNode["-SWIPED_ON->Job"]) return
            nodeToDeleteRef.current = userNode["-SWIPED_ON->Job"]![Object.keys(userNode["-SWIPED_ON->Job"]!)[0]]!
        }
    }, [userNode])
    useImperativeHandle(ref, () => ({
        draft,
        updateDraft,
        commit: commit as any,
        isCommitSuccessful,
        nodeToDelete: nodeToDeleteRef.current!
    }), [updateDraft, isCommitSuccessful])
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
    useEffect(() => {console.log("Render from isCommitSuccessful", isCommitSuccessful)}, [isCommitSuccessful])

    // console.log("Actual:", userNode)
    // console.log("Draft:", draft)
    return (<></>)
})

test('Test Render Cycles', async () => {
    await mergeSubgraph({
        nodeType: 'User',
        email: 'dan.lannan@thinair.cloud',
        firstName: '',
        '-SWIPED_ON->Job': {
            draft: {
                'title': "Integration Test Job",
                'companyName': "Acme",
                'description': "Do stuff"
            },
            draft2: {
                'title': "Integration Test Job 2",
                'companyName': "Acme",
                'description': "Do stuff"
            }
        }
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
    console.log("isCommitSuccessful", ref.current?.isCommitSuccessful)
    await waitFor(() => expect(ref.current?.isCommitSuccessful).toBe(true), {timeout: 3000, interval: 1000})
    // Handle Deletion
    await act(async () => {
        console.log("Calling updateDraft with delete")
        ref.current?.updateDraft(draft => {
            (draft!["-SWIPED_ON->Job"]![ref.current!.nodeToDelete.nodeId]! as any) = {
                ...ref.current!.nodeToDelete,
                delete: true
            }
        })
    }) 
    await act(async () => {
        console.log("Calling commitDraft")
        console.log("Draft being committed", ref.current?.draft)
        ref.current?.commit(ref.current!.draft!)
    })
    await setTimeout(1000)
    // Handle Creation
    await act(async () => {
        console.log("Calling updateDraft with create")
        ref.current?.updateDraft(draft => {
            draft["-SWIPED_ON->Job"]!['draft'] = {
                'title': "Integration Test Job 3",
                'companyName': "Acme",
                'description': "Do stuff"
            }
        })
    })
    await act(async () => {
        console.log("Calling commitDraft")
        ref.current?.commit(ref.current!.draft!)
    })
    await setTimeout(1000)
})