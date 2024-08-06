
'use client'

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ConfiguredNodeDefinitionMap, nodeDefinitionMap } from "./staticObjects";
import { NodeState, NodeStateTree, GenericNodeShapeTree, NodeShape } from "@thinairthings/uix";
import { produce, WritableDraft } from "immer";
import { mergeSubgraph } from "./functionModule";
import { useImmer } from "@thinairthings/use-immer";
import { cacheKeyMap } from "./_useSubgraph";
import { useEffect } from "react";
import { AnyZodObject, z, ZodObject, ZodTypeAny } from "zod";

export const useSubgraphDraft = <
    NodeType extends keyof ConfiguredNodeDefinitionMap,
    Subgraph extends 
        | NodeShape<ConfiguredNodeDefinitionMap[NodeType]> 
        | NodeState<ConfiguredNodeDefinitionMap[NodeType]>
>(subgraph: (
    ({
        nodeType: NodeType
    }) & Subgraph 
),
schema?: (stateSchema: typeof nodeDefinitionMap[NodeType]['stateSchema']) => ZodObject<{
    [K in keyof NodeState<ConfiguredNodeDefinitionMap[NodeType]>]: ZodTypeAny
}>
) => {
    const queryClient = useQueryClient()
    const [draft, updateDraft] = useImmer(subgraph as Subgraph & NodeShape<ConfiguredNodeDefinitionMap[NodeType]>)
    const [draftErrors, setDraftErrors] = useImmer({} as {
        [K in keyof NodeState<ConfiguredNodeDefinitionMap[NodeType]>]?: {message: string} | undefined
    })
    useEffect(() => {
        if (draft || !subgraph) return
        updateDraft(subgraph as Subgraph & NodeShape<ConfiguredNodeDefinitionMap[NodeType]>)
    }, [subgraph])
    const mutation = useMutation({
        mutationFn: async () => {
            console.log("SAVING!", JSON.stringify(draft))
            const {data, error} = await mergeSubgraph(draft as any)
            return null as any
        },
        onMutate: async () => {
            const getRelationshipEntries = (subgraph: object) => Object.entries(subgraph).filter(([key]) => key.includes('->') || key.includes('<-'))
            const createNestedSchema = (node: GenericNodeShapeTree, acc: AnyZodObject=z.object({})) => {
                const nextSchema = nodeDefinitionMap[node.nodeType as any].stateSchema
                acc = acc.merge(nextSchema)
                getRelationshipEntries(node).forEach(([key, nextNodeSet]) => {
                    if (Array.isArray(nextNodeSet)) {
                        acc = acc.extend({
                            [key]: z.array(createNestedSchema({
                                ...nextNodeSet[0],
                                nodeType: key.split('-')[2].replace('>', '')
                            }, z.object({})))
                        })
                    } else {
                        acc.extend({
                            [key]: createNestedSchema({
                                ...nextNodeSet,
                                nodeType: key.split('-')[2].replace('>', '')
                            }, z.object({}))
                        })
                    }
                })
                return acc
            }
            const nestedSchema = createNestedSchema(draft as any)
            console.log(JSON.stringify(nestedSchema.shape, null, 2))
            if (!draft || !subgraph || !draft.nodeId) return
            const res = schema?.(createNestedSchema(draft as any)).safeParse(draft as any)
            if (res?.error){
                const errorSet = res?.error?.issues.reduce((acc, issue) => {
                    acc[issue.path[0] as keyof NodeState<ConfiguredNodeDefinitionMap[NodeType]>] = {message: issue.message}
                    return acc
                }, {} as {
                    [K in keyof NodeState<ConfiguredNodeDefinitionMap[NodeType]>]?: {message: string} | undefined
                })
                setDraftErrors(errorSet)
                throw new Error('Invalid draft')
            }
            setDraftErrors({})
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
            console.log(error)
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
        updateDraft,
        isCommitting: mutation.isPending,
        isCommitSuccessful: mutation.isSuccess,
        commitDraft: (options?: Parameters<typeof mutation['mutate']>[1]) => mutation.mutate(undefined, options)
    }
}
