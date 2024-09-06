
'use client'
import { useQuery, useMutation, useQueryClient, skipToken } from "@tanstack/react-query"
import { ConfiguredNodeDefinitionMap, nodeDefinitionMap } from "./staticObjects"
import {  validateDraftSchema, DraftErrorTree, AnyNodeDefinitionMap, SubgraphDefinition, SubgraphPathDefinition, QueryError, GenericMergeOutputTree, AnySubgraphDefinition, NodeState, ExtractOutputTree, MergeInputTree, getRelationshipEntries, RelationshipKey, treeRecursion, testEnvLog, GenericNodeShape} from "@thinairthings/uix"
import { extractSubgraph, mergeSubgraph } from "./functionModule"
import { ZodObject, ZodTypeAny, z, AnyZodObject, ZodIssue, custom } from "zod"
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
        initialize: <T extends {nodeType: RootNodeType}&MergeInputTree<typeof nodeDefinitionMap, RootNodeType>>(freeze: T) => T
    ) => Data
}) => {
    const queryClient = useQueryClient()
    const {data, isPending, isError, isFetching} = useQuery({
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
            ((addNodeToCache=(node: GenericMergeOutputTree) => {
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
            })=> addNodeToCache(subgraph))()
            initialDraftRef.current = ((initializeDraft && subgraph)
                ? initializeDraft(result.data, (initializedDraft) => initializedDraft) 
                : subgraph
            ) as any
            updateDraft(initialDraftRef.current)
            return result.data 
        } : skipToken
    })
    const subgraph = data
    const initialDraftRef = useRef((initializeDraft && (subgraph || (rootNodeIndex && Object.keys(rootNodeIndex??{}).length === 1 && 'nodeType' in rootNodeIndex))
        ? initializeDraft((subgraph??{}) as any, (initializedDraft) => initializedDraft) 
        : subgraph
    ) as Data | undefined)
    const [draft, updateDraft] = useImmer(initialDraftRef.current)
    const [draftErrors, setDraftErrors] = useImmer({} as DraftErrorTree<Data>)
    const mutation = useMutation({
        mutationFn: async (mergeInput:Data) => {
            const {data, error} = await mergeSubgraph(mergeInput as any)
            if (error) throw new QueryError(error)
            return data
        },
        onMutate: async (mergeInputTree: Data) => {
            const cachedTreeSet = cacheKeyMap.has(mergeInputTree.nodeId as string) && [...cacheKeyMap.get(mergeInputTree.nodeId as string)!.values()]
                .map(paramString => [
                    paramString, 
                    queryClient.getQueryData([JSON.parse(paramString)])
                ] as const) as [string, GenericMergeOutputTree][]

            cachedTreeSet && cachedTreeSet.forEach(([paramString, cachedTree]) => {
                if (!cachedTree) return // Need to figure out why this is sometimes undefined
                queryClient.setQueryData([JSON.parse(paramString)], produce(cachedTree, (cachedTreeDraft) => {
                    treeRecursion({
                        treeNode: cachedTreeDraft, 
                        operation: ({treeNode: cachedTreeNodeDraft, parentNodeMap}) => {
                            if (cachedTreeNodeDraft.nodeId === mergeInputTree.nodeId) {
                                if ((mergeInputTree as GenericNodeShape & {detach?:boolean, delete?:boolean})['delete']) {
                                    parentNodeMap && delete parentNodeMap[mergeInputTree.nodeId]
                                    return 'exit'
                                }
                                Object.assign(cachedTreeNodeDraft, _.mergeWith(
                                    JSON.parse((JSON.stringify(cachedTreeNodeDraft))
                                ), mergeInputTree, ((customMerge=(cachedNode: GenericNodeShape | undefined, inputNode: GenericNodeShape | undefined) => {
                                    if (_.isObject(cachedNode) && _.isObject(inputNode)) {
                                        const cachedNodeMap: Record<string, GenericNodeShape & {detach?:boolean, delete?:boolean}> = cachedNode as any
                                        const inputNodeMap: Record<string, GenericNodeShape & {detach?:boolean, delete?:boolean}> = inputNode as any
                                        Object.entries(inputNodeMap).forEach(([nodeId, node]) => {
                                            if (!node.delete && !node.detach) return
                                            delete cachedNodeMap[nodeId]
                                        })
                                        return _.mergeWith(cachedNode, inputNode, customMerge)
                                    }
                                }) => customMerge)()))
                                return 'exit'
                            }
                            return 'continue'
                        }
                    })
                }))
            })
            // Send previous data for rollback
            return {previousData: cachedTreeSet}
        },
        onError: async (error, variables, context) => {
            console.error("ON ERROR", error)
            // Rollback
            const {previousData: cachedTreeSet} = context as {previousData: [string, GenericMergeOutputTree][]}
            cachedTreeSet.forEach(([paramString, cachedTree]) => {
                queryClient.setQueryData([JSON.parse(paramString)], cachedTree)
            })
        },
        onSuccess: (mergeOutput) => {
            testEnvLog("MergeOutput", mergeOutput)
            testEnvLog("Data", data)
            testEnvLog("Running invalidation")
            treeRecursion({
                treeNode: mergeOutput as GenericNodeShape,
                operation: ({treeNode}) => {
                    cacheKeyMap.has(treeNode.nodeId as string) 
                    && [...cacheKeyMap.get(treeNode.nodeId as string)!.values()].forEach(paramString => {
                        queryClient.invalidateQueries({
                            queryKey: [JSON.parse(paramString)]
                        })
                    })
                    return 'continue'
                }
            })
            // Note: You could do something to reduce networks calls here. On success you can assume the data is correct and update the cache
            // without having to invalidate all the queries.
        }
    })
    useEffect(() => {
        if (!subgraph || _.isEqual(initialDraftRef.current, subgraph)) return
        initialDraftRef.current = ((initializeDraft && subgraph) 
            ? initializeDraft(subgraph, (initializedDraft) => initializedDraft) 
            : subgraph
        ) as any
        updateDraft(initialDraftRef.current as any)
    }, [subgraph])
    return {
        data,
        isPending,
        isFetching,
        isError,
        draft,
        draftDidChange: !_.isEqual(draft, initialDraftRef.current),
        draftErrors,
        resetDraftErrors: useCallback(() => setDraftErrors({} as DraftErrorTree<Data>), []),
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
            async <NodeType extends keyof ConfiguredNodeDefinitionMap>(data: MergeInputTree<ConfiguredNodeDefinitionMap, NodeType>, options?: Parameters<typeof mutation['mutate']>[1]) => {
                const errorSet = await validateDraftSchema<Data>(
                    modifySchema?.(createNestedZodSchema(nodeDefinitionMap, data as any) as any)
                    ?? createNestedZodSchema(nodeDefinitionMap, data as any),
                    data
                )
                if (errorSet) {
                    setDraftErrors(errorSet)
                    return
                }
                !_.isEqual(draftErrors, {}) && setDraftErrors({} as DraftErrorTree<Data>)
                mutation.mutate(treeRecursion({
                    treeNode: JSON.parse((JSON.stringify(data))) as any, 
                    operation: ({treeNode, relationshipKey, mapId, parentNode, parentNodeMap}) => {
                        const nodeType = relationshipKey?.split('-')[2]!.replace('>', '')
                        if (nodeType) {treeNode['nodeType'] = nodeType}
                        if (!treeNode['createdAt']) {treeNode['createdAt'] = Date.now()}
                        if (!treeNode['updatedAt']) {treeNode['updatedAt'] = Date.now()}
                        if (!treeNode['fromNodeId']) {parentNode && (treeNode['fromNodeId'] = parentNode.nodeId)}
                        if (!treeNode['fromNodeType']) {parentNode && (treeNode['fromNodeType'] = parentNode.nodeType)}
                        if (!treeNode['nodeId']) {
                            if (parentNodeMap){delete parentNodeMap[mapId!]}
                            treeNode['nodeId'] = uuid()
                        }
                        if (!parentNodeMap) return 'continue'
                        parentNodeMap[treeNode['nodeId']] = treeNode
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
