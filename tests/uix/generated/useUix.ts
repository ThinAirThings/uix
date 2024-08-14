

'use client'
import { useQuery, useMutation, useQueryClient, skipToken } from "@tanstack/react-query"
import { ConfiguredNodeDefinitionMap, nodeDefinitionMap } from "./staticObjects"
import {  validateDraftSchema, DraftErrorTree, AnyNodeDefinitionMap, SubgraphDefinition, SubgraphPathDefinition, QueryError, GenericMergeOutputTree, AnySubgraphDefinition, NodeState, ExtractOutputTree, MergeInputTree, getRelationshipEntries, RelationshipKey, treeRecursion} from "@thinairthings/uix"
import { extractSubgraph, mergeSubgraph } from "./functionModule"
import { ZodObject, ZodTypeAny, z, AnyZodObject, ZodIssue } from "zod"
import { useImmer } from "@thinairthings/use-immer"
import { useCallback, useEffect, useRef } from "react"
import { produce, WritableDraft } from "immer"
import _ from "lodash"
import {v4 as uuid} from 'uuid'

export const cacheKeyMap = new Map<string, Set<string>>()
export const useUix = <
    RootNodeType extends keyof ConfiguredNodeDefinitionMap,
    SubgraphIndex extends ({
        [UniqueIndex in ConfiguredNodeDefinitionMap[RootNodeType]['uniqueIndexes'][number]]?: string
    }),
    SubgraphDefinitionRef extends AnySubgraphDefinition,
    Data extends 
        | MergeInputTree<ConfiguredNodeDefinitionMap, RootNodeType> 
        | ExtractOutputTree<ConfiguredNodeDefinitionMap, SubgraphDefinitionRef, RootNodeType>
    = ExtractOutputTree<ConfiguredNodeDefinitionMap, SubgraphDefinitionRef, RootNodeType>&MergeInputTree<ConfiguredNodeDefinitionMap, RootNodeType> 
>({
    rootNodeIndex,
    defineSubgraph,
    modifySchema,
    initializeDraft
}: {    
    rootNodeIndex: (({
        nodeType: RootNodeType
    }) & SubgraphIndex) | undefined,
    defineSubgraph?: (subgraph: SubgraphDefinition<
        ConfiguredNodeDefinitionMap, 
        [SubgraphPathDefinition<
            ConfiguredNodeDefinitionMap,
            RootNodeType,
            []
        >]>
    ) => SubgraphDefinitionRef,
    modifySchema?: (stateSchema: typeof nodeDefinitionMap[RootNodeType]['stateSchema']) => ZodObject<{
        [K in keyof NodeState<ConfiguredNodeDefinitionMap[RootNodeType]>]: ZodTypeAny
    }>,
    initializeDraft?: (
        data: ExtractOutputTree<typeof nodeDefinitionMap, SubgraphDefinitionRef, RootNodeType>,
        initialize: <T extends MergeInputTree<typeof nodeDefinitionMap, RootNodeType>>(freeze: T) => T
    ) => Data
}) => {
    const queryClient = useQueryClient()
    const {data, isPending} = useQuery({
        queryKey: rootNodeIndex ? [{
            rootNodeIndex: {
                nodeType: rootNodeIndex.nodeType,
                ...Object.fromEntries(nodeDefinitionMap[rootNodeIndex.nodeType]!.uniqueIndexes
                    .filter((index:string) => !!rootNodeIndex[index as keyof typeof rootNodeIndex])
                    .map((index: any) => [index, rootNodeIndex[index as keyof typeof rootNodeIndex]])
                )
            } as (({
                nodeType: RootNodeType
            }) & SubgraphIndex),
            subgraphDefinition: defineSubgraph?.(new SubgraphDefinition(
                nodeDefinitionMap,
                [new SubgraphPathDefinition(
                    nodeDefinitionMap,
                    rootNodeIndex.nodeType,
                    []
                )]
            )).serialize()}
        ] as const : [] as const,
        queryFn: rootNodeIndex ? async ({queryKey: [params]}) => {
            const result = await extractSubgraph(params!.rootNodeIndex, params!.subgraphDefinition)
            if (result.error) throw new QueryError(result.error)
            const subgraph = result.data as GenericMergeOutputTree
            const addNodeToCache = (node: GenericMergeOutputTree) => {
                cacheKeyMap.set(
                    node.nodeId as string, 
                    cacheKeyMap.get(node.nodeId as string) 
                        ? cacheKeyMap.get(node.nodeId as string)!.add(JSON.stringify(params)) 
                        : new Set<string>([JSON.stringify(params)])
                )
                getRelationshipEntries(node).forEach(([key, nodeMap]) => {
                    Object.entries(nodeMap).forEach(([_, value]) => {
                        addNodeToCache(value as GenericMergeOutputTree)
                    })
                })
            }
            addNodeToCache(subgraph)
            initialDraftRef.current = ((initializeDraft && subgraph) 
                ? initializeDraft(result.data, (initializedDraft) => initializedDraft) 
                : subgraph
            ) as any
            updateDraft(initialDraftRef.current)
            return result.data 
        } : skipToken
    })
    const subgraph = data
    const initialDraftRef = useRef(((initializeDraft && subgraph) 
        ? initializeDraft(subgraph, (initializedDraft) => initializedDraft) 
        : subgraph
    ) as Data | undefined)
    const [draft, updateDraft] = useImmer(initialDraftRef.current)
    const [draftErrors, setDraftErrors] = useImmer({} as DraftErrorTree<Data>)
    const mutation = useMutation({
        mutationFn: async (data:Data) => {
            if (!draft || !subgraph) return
            return await mergeSubgraph(data as any)
        },
        onMutate: async () => {
            if (!draft || !subgraph) return
            const errorSet = validateDraftSchema<Data>(
                modifySchema?.(createNestedZodSchema(nodeDefinitionMap, draft as any) as any)
                ?? createNestedZodSchema(nodeDefinitionMap, draft as any),
                draft
            )
            if (errorSet) {
                setDraftErrors(errorSet)
                throw new Error('Invalid draft')
            }
            !_.isEqual(draftErrors, {}) && setDraftErrors({} as DraftErrorTree<Data>)
            const subgraphsContainingDraft = cacheKeyMap.has(draft.nodeId as string) && [...cacheKeyMap.get(draft.nodeId as string)!.values()]
                .map(paramString => [
                    paramString, 
                    queryClient.getQueryData([JSON.parse(paramString)])
                ] as const) as [string, GenericMergeOutputTree][]
            // Handle Caching
            console.log("Running optimistic update")
            // Add Metadata To Draft
            const draftWithMetadata = treeRecursion({
                treeNode: JSON.parse((JSON.stringify(draft))) as any, 
                operation: ({treeNode, relationshipKey, mapId, parentNodeMap}) => {
                    const nodeType = relationshipKey?.split('-')[2]!.replace('>', '')
                    if (nodeType) {treeNode['nodeType'] = nodeType}
                    if (!treeNode['createdAt']) {treeNode['createdAt'] = Date.now()}
                    if (!treeNode['updatedAt']) {treeNode['updatedAt'] = Date.now()}
                    if (!treeNode['nodeId']) {treeNode['nodeId'] = mapId} else {
                        if (!parentNodeMap) return 'continue'
                        parentNodeMap[treeNode['nodeId']] = treeNode
                        delete parentNodeMap[mapId!]
                    } 
                    return 'continue'
                }
            })
            subgraphsContainingDraft && subgraphsContainingDraft.forEach(([paramString, subgraphContainingDraft]) => {
                queryClient.setQueryData([JSON.parse(paramString)], produce(subgraphContainingDraft, (draftOfSubgraphContainingDraft) => {
                    treeRecursion({
                        treeNode: draftOfSubgraphContainingDraft, 
                        operation: ({treeNode}) => {
                            if (treeNode.nodeId === draft.nodeId) {
                                Object.assign(treeNode, _.merge(JSON.parse((JSON.stringify(treeNode))), draftWithMetadata))
                                return 'exit'
                            }
                            return 'continue'
                        }
                    })
                }))
            })
            // Send previous data for rollback
            return {previousData: subgraphsContainingDraft}
        },
        onError: async (error, variables, context) => {
            console.error("ON ERROR", error)
            // Rollback
            const {previousData} = context as {previousData: [string, GenericMergeOutputTree][]}
            previousData.forEach(([paramString, previousSubgraph]) => {
                queryClient.setQueryData([JSON.parse(paramString)], previousSubgraph)
            })
        },
        onSuccess: (result) => {
            console.log("Result", result)
            if (!draft) return
            cacheKeyMap.has(draft.nodeId as string) && [...cacheKeyMap.get(draft.nodeId as string)!.values()].forEach(paramString => {
                queryClient.invalidateQueries({
                    queryKey: [JSON.parse(paramString)]
                })
            })
            // Note: You could do something to reduce networks calls here. On success you can assume the data is correct and update the cache
            // without having to invalidate all the queries.
        }
    })
    useEffect(() => {
        if (!subgraph || mutation.isPending || _.isEqual(initialDraftRef.current, subgraph)) return
        initialDraftRef.current = ((initializeDraft && subgraph) 
            ? initializeDraft(subgraph, (initializedDraft) => initializedDraft) 
            : subgraph
        ) as any
        updateDraft(initialDraftRef.current as any)
    }, [subgraph])
    return {
        data,
        isPending,
        draft,
        draftDidChange: !_.isEqual(draft, initialDraftRef.current),
        draftErrors,
        isCommitPending: mutation.isPending,
        isCommitSuccessful: mutation.isSuccess,
        isCommitError: mutation.isError,
        resetDraft: useCallback(() => updateDraft(draft => {
            if (!draft) return
            Object.assign(draft, initialDraftRef.current)
        }), [draft]),
        updateDraft: useCallback((updater: (callbackDraft: WritableDraft<NonNullable<typeof draft>>) => void) => {
            if (!draft) return
            updateDraft(draft => {
                updater(draft as any)
            })
        }, [draft]),
        commit: useCallback(
            (data: Data, options?: Parameters<typeof mutation['mutate']>[1]) => {
                mutation.mutate(treeRecursion({
                    treeNode: JSON.parse((JSON.stringify(data))) as any, 
                    operation: ({treeNode, relationshipKey, mapId, parentNodeMap}) => {
                        const nodeType = relationshipKey?.split('-')[2]!.replace('>', '')
                        if (nodeType) {treeNode['nodeType'] = nodeType}
                        if (!treeNode['createdAt']) {treeNode['createdAt'] = Date.now()}
                        if (!treeNode['updatedAt']) {treeNode['updatedAt'] = Date.now()}
                        if (!treeNode['nodeId']) {treeNode['nodeId'] = uuid()}
                        if (!parentNodeMap) return 'continue'
                        parentNodeMap[treeNode['nodeId']] = treeNode
                        delete parentNodeMap[mapId!]
                        return 'continue'
                    }
                }), options)
            }
        , [mutation.mutate])
    }
}

export const createNestedZodSchema = (nodeDefinitionMap: AnyNodeDefinitionMap, node: GenericMergeOutputTree, acc: AnyZodObject=z.object({})) => {
    const nextSchema = nodeDefinitionMap[node.nodeType as keyof typeof nodeDefinitionMap]!.stateSchema
    acc = acc.merge(nextSchema)
    getRelationshipEntries(node).forEach(([key, nextNodeMap]) => {
        Object.entries(nextNodeMap).forEach(([_, node]) => {
            acc = acc.extend({
                [key]: z.record(z.string(), createNestedZodSchema(nodeDefinitionMap, {
                    ...node as any,
                    nodeType: key.split('-')[2]!.replace('>', '')
                }, z.object({})))
            })
        })
    })
    return acc
}
