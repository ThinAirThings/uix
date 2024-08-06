
'use client'

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ConfiguredNodeDefinitionMap, nodeDefinitionMap } from "./staticObjects";
import { 
    NodeState, 
    NodeStateTree, 
    GenericNodeShapeTree, 
    NodeShape, 
    getRelationshipEntries, 
    createNestedZodSchema, 
    RelationshipUnion, 
    RelationshipState,
    AnyRelationshipDefinition
} from "@thinairthings/uix";
import { produce, WritableDraft } from "immer";
import { mergeSubgraph } from "./functionModule";
import { useImmer } from "@thinairthings/use-immer";
import { cacheKeyMap } from "./useSubgraph";
import { useEffect, useRef } from "react";
import { z, ZodObject, ZodTypeAny } from "zod";




export const useSubgraphDraft = <
NodeType extends keyof ConfiguredNodeDefinitionMap,
Relationship extends RelationshipUnion<ConfiguredNodeDefinitionMap, NodeType>,
Subgraph extends NodeState<ConfiguredNodeDefinitionMap[NodeType]> 
    & (Relationship extends `-${infer RelationshipType}->${infer RelatedNodeType}`
        ? ConfiguredNodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number] extends (infer RelationshipUnionRef extends AnyRelationshipDefinition | never)
            ? AnyRelationshipDefinition extends RelationshipUnionRef
                ? RelationshipState<
                    (RelationshipUnionRef&{type: RelationshipType})
                >
                : unknown
            : unknown
        : Relationship extends `<-${infer RelationshipType}-${infer RelatedNodeType extends keyof ConfiguredNodeDefinitionMap}`
            ? ConfiguredNodeDefinitionMap[RelatedNodeType]['relationshipDefinitionSet'][number] extends (infer RelationshipUnionRef extends AnyRelationshipDefinition | never)
                ? AnyRelationshipDefinition extends RelationshipUnionRef
                    ? RelationshipState<
                        (RelationshipUnionRef&{type: RelationshipType})
                    >
                    : unknown
                : unknown
            : unknown
    )
>(subgraph: (
    ({
        nodeType: `${NodeType}`
        relationship?: `${Relationship}`
    }) & Subgraph 
) | undefined,
schema?: (stateSchema: typeof nodeDefinitionMap[NodeType]['stateSchema']) => ZodObject<{
    [K in keyof NodeState<ConfiguredNodeDefinitionMap[NodeType]>]: ZodTypeAny
}>
) => {
    const queryClient = useQueryClient()
    const [draft, updateDraft] = useImmer(subgraph as Subgraph & NodeStateTree<ConfiguredNodeDefinitionMap, NodeType>)
    const [draftErrors, setDraftErrors] = useImmer({} as {
        [K in keyof NodeState<ConfiguredNodeDefinitionMap[NodeType]>]?: string | undefined
    })
    const subgraphRef = useRef(subgraph)
    useEffect(() => {
        if (!subgraphRef.current) return
        if (subgraphRef.current !== produce(subgraphRef.current, draft => {
            Object.assign(draft, subgraph)
        })) {
            updateDraft(subgraph as any)
            subgraphRef.current = subgraph
        }
    }, [subgraph])
    const mutation = useMutation({
        mutationFn: async () => {
            const {data, error} = await mergeSubgraph(draft as any)
            return null as any
        },
        onMutate: async () => {
            if (!draft || !subgraph) return
            const res = (schema?.(createNestedZodSchema(nodeDefinitionMap, draft as any) as any)
                ??createNestedZodSchema(nodeDefinitionMap, draft as any)).extend({
                    nodeId: z.string(),
                    nodeType: z.string(),
                    updatedAt: z.number(),
                    createdAt: z.number()
                }).safeParse(draft as any)
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
            const previousSubgraphEntries = cacheKeyMap.has((draft as GenericNodeShapeTree).nodeId as string) && [...cacheKeyMap.get((draft as GenericNodeShapeTree).nodeId as string)!.values()]
                .map(paramString => [
                    paramString, 
                    queryClient.getQueryData([JSON.parse(paramString)])
                ] as const) as [string, GenericNodeShapeTree][]
            previousSubgraphEntries && previousSubgraphEntries.forEach(([paramString, previousSubgraph]) => {
                const updatedSubgraph = produce(previousSubgraph, previousSubgraphDraft => {
                    const findAndReplace = (subgraphNode: WritableDraft<GenericNodeShapeTree>) => {
                        if (subgraphNode.nodeId === (draft as GenericNodeShapeTree).nodeId) {
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
            cacheKeyMap.has((draft as GenericNodeShapeTree).nodeId as string) && [...cacheKeyMap.get((draft as GenericNodeShapeTree).nodeId as string)!.values()].forEach(paramString => {
                queryClient.invalidateQueries({
                    queryKey: [JSON.parse(paramString)]
                })
            })
        }
    })
    return {
        draft, 
        draftErrors,
        updateDraft: (updater: (callbackDraft: WritableDraft<typeof draft>) => void) => {
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
