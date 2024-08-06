

export const useSubgraphDraftTemplate = () => /*ts*/`
'use client'

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ConfiguredNodeDefinitionMap, nodeDefinitionMap } from "./staticObjects";
import { NodeState, NodeStateTree, GenericNodeShapeTree } from "@thinairthings/uix";
import { produce, WritableDraft } from "immer";
import { mergeSubgraph } from "./functionModule";
import { useImmer } from "@thinairthings/use-immer";
import { cacheKeyMap } from "./useSubgraph";
import { useEffect } from "react";
import { ZodObject, ZodTypeAny } from "zod";

export const useSubgraphDraft = <
    NodeType extends keyof ConfiguredNodeDefinitionMap,
    Subgraph extends 
        | NodeState<ConfiguredNodeDefinitionMap[NodeType]>
>(subgraph: (
    ({
        nodeType: NodeType
    }) & Subgraph 
) | undefined,
schema?: (stateSchema: typeof nodeDefinitionMap[NodeType]['stateSchema']) => ZodObject<{
    [K in keyof NodeState<ConfiguredNodeDefinitionMap[NodeType]>]: ZodTypeAny
}>
) => {
    const queryClient = useQueryClient()
    const [draft, updateDraft] = useImmer(subgraph as (NodeStateTree<ConfiguredNodeDefinitionMap, NodeType>) | undefined)
    const [draftErrors, setDraftErrors] = useImmer({} as {
        [K in keyof NodeState<ConfiguredNodeDefinitionMap[NodeType]>]?: string | undefined
    })
    useEffect(() => {
        if (draft || !subgraph) return
        updateDraft(subgraph as (NodeStateTree<ConfiguredNodeDefinitionMap, NodeType>))
    }, [subgraph])
    const mutation = useMutation({
        mutationFn: async () => {
            if (!draft || !subgraph) return
            const {data, error} = await mergeSubgraph(draft as any)
            return null as any
        },
        onMutate: async () => {
            if (!draft || !subgraph) return
            const res = schema?.(nodeDefinitionMap[subgraph.nodeType].stateSchema as typeof nodeDefinitionMap[NodeType]['stateSchema']).safeParse(draft as any)
            if (res?.error){
                const errorSet = res?.error?.issues.reduce((acc, issue) => {
                    acc[issue.path[0] as keyof NodeState<ConfiguredNodeDefinitionMap[NodeType]>] = issue.message
                    return acc
                }, {} as {
                    [K in keyof NodeState<ConfiguredNodeDefinitionMap[NodeType]>]?: string | undefined
                })
                setDraftErrors(errorSet)
                throw new Error('Invalid draft')
            }
            setDraftErrors({})
            const getRelationshipEntries = (subgraph: object) => Object.entries(subgraph).filter(([key]) => key.includes('->') || key.includes('<-'))
            const previousSubgraphEntries = cacheKeyMap.has(draft.nodeId as string) && [...cacheKeyMap.get(draft.nodeId as string)!.values()]
                .map(paramString => [
                    paramString, 
                    queryClient.getQueryData([JSON.parse(paramString)])
                ] as const) as [string, GenericNodeShapeTree][]
            previousSubgraphEntries && previousSubgraphEntries.forEach(([paramString, previousSubgraph]) => {
                const updatedSubgraph = produce(previousSubgraph, previousSubgraphDraft => {
                    const findAndReplace = (subgraphNode: WritableDraft<GenericNodeShapeTree>) => {
                        if (subgraphNode.nodeId === draft.nodeId) {
                            Object.assign(subgraphNode, draft)
                            return
                        }
                        getRelationshipEntries(subgraphNode).forEach(([key, value]) => {
                            if (Array.isArray(value)) {
                                value.forEach(findAndReplace)
                            } else {
                                findAndReplace(value)
                            }
                        })
                    }
                    findAndReplace(previousSubgraphDraft)
                })
                queryClient.setQueryData([JSON.parse(paramString)], updatedSubgraph)
            })
            // Send previous data for rollback
            return {previousData: previousSubgraphEntries}
        },
        onError: async (error, variables, context) => {
            // Rollback
            const {previousData} = context as {previousData: [string, GenericNodeShapeTree][]}
            previousData.forEach(([paramString, previousSubgraph]) => {
                queryClient.setQueryData([JSON.parse(paramString)], previousSubgraph)
            })
        },
        onSuccess: () => {
            if (!draft) return
            cacheKeyMap.has(draft.nodeId as string) && [...cacheKeyMap.get(draft.nodeId as string)!.values()].forEach(paramString => {
                queryClient.invalidateQueries({
                    queryKey: [JSON.parse(paramString)]
                })
            })
        }
    })
    return {
        draft, 
        draftErrors,
        updateDraft: (updater: (callbackDraft: WritableDraft<NonNullable<typeof draft>>) => void) => {
            if (!draft) return
            updateDraft(draft => {
                updater(draft as any)
            })
        },
        isCommitting: mutation.isPending,
        isCommitSuccessful: mutation.isSuccess,
        commitDraft: (options?: Parameters<typeof mutation['mutate']>[1]) => mutation.mutate(undefined, options)
    }
}
`