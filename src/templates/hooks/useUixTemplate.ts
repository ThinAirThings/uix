
const relationshipStringTemplate = () => '`-${string}->${string}`|`<-${string}-${string}`'

export const useUixTemplate = () => /*ts*/`
'use client'
import { useQuery, useMutation, useQueryClient, skipToken } from "@tanstack/react-query"
import { ConfiguredNodeDefinitionMap, nodeDefinitionMap } from "./staticObjects"
import { AnyNodeDefinitionMap, SubgraphDefinition, SubgraphPathDefinition, QueryError, GenericMergeOutputTree, AnySubgraphDefinition, NodeState, ExtractOutputTree, MergeInputTree, getRelationshipEntries} from "@thinairthings/uix"
import { extractSubgraph, mergeSubgraph } from "./functionModule"
import { ZodObject, ZodTypeAny, z, AnyZodObject } from "zod"
import { useImmer } from "@thinairthings/use-immer"
import { useEffect } from "react"
import { produce, WritableDraft } from "immer"



export const cacheKeyMap = new Map<string, Set<string>>()
export const useUix = <
    RootNodeType extends keyof ConfiguredNodeDefinitionMap,
    SubgraphIndex extends ({
        [UniqueIndex in ConfiguredNodeDefinitionMap[RootNodeType]['uniqueIndexes'][number]]?: string
    }),
    SubgraphDefinitionRef extends AnySubgraphDefinition,
    Data extends (MergeInputTree<ConfiguredNodeDefinitionMap, RootNodeType>) | ExtractOutputTree<typeof nodeDefinitionMap, SubgraphDefinitionRef, RootNodeType>= ExtractOutputTree<typeof nodeDefinitionMap, SubgraphDefinitionRef, RootNodeType>
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
    const queryResult = useQuery({
        queryKey: rootNodeIndex ? [{rootNodeIndex, subgraphDefinition: defineSubgraph?.(new SubgraphDefinition(
            nodeDefinitionMap,
            [new SubgraphPathDefinition(
                nodeDefinitionMap,
                rootNodeIndex.nodeType,
                []
            )]
        )).serialize()}] as const : [] as const,
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
            return result.data 
        } : skipToken
    })
    const subgraph = queryResult.data
    const [draft, updateDraft] = useImmer(((initializeDraft && subgraph) 
        ? initializeDraft(subgraph, (initializedDraft) => initializedDraft) 
        : subgraph
    ) as Data | undefined)
    
    type DraftErrorTree<
        DraftTree extends Record<string, any>
    > = {
        [K in keyof DraftTree as Exclude<K, 'nodeId'|'createdAt'|'updatedAt'|'nodeType'>]: 
            K extends ${relationshipStringTemplate()}
                ? {
                    [Id in keyof DraftTree[K]]: DraftErrorTree<DraftTree[K][Id]> 
                }
                : string
    }
    const [draftErrors, setDraftErrors] = useImmer({} as DraftErrorTree<Data>)

    
    const mutation = useMutation({
        mutationFn: async () => {
            if (!draft || !subgraph) return
            await mergeSubgraph(draft as any)
            return null as any
        },
        onMutate: async () => {
            if (!draft || !subgraph) return
            const res = (
                modifySchema?.(createNestedZodSchema(nodeDefinitionMap, draft as any) as any)
                ?? createNestedZodSchema(nodeDefinitionMap, draft as any)
            ).extend({
                nodeId: z.string(),
                nodeType: z.string(),
                updatedAt: z.number(),
                createdAt: z.number()
            }).safeParse(draft as any)
            console.log(res)
            if (res?.error){
                console.log(res)
                const errorSet = res?.error?.issues.reduce((acc, issue) => {
                    acc[issue.path[0] as keyof typeof acc] = issue.message
                    return acc
                }, {} as any)
                setDraftErrors(errorSet)
                throw new Error('Invalid draft')
            }
            setDraftErrors({} as DraftErrorTree<Data>)
            const previousSubgraphEntries = cacheKeyMap.has(draft.nodeId as string) && [...cacheKeyMap.get(draft.nodeId as string)!.values()]
                .map(paramString => [
                    paramString, 
                    queryClient.getQueryData([JSON.parse(paramString)])
                ] as const) as [string, GenericMergeOutputTree][]
            previousSubgraphEntries && previousSubgraphEntries.forEach(([paramString, previousSubgraph]) => {
                const updatedSubgraph = produce(previousSubgraph, previousSubgraphDraft => {
                    const findAndReplace = (subgraphNode: WritableDraft<GenericMergeOutputTree>) => {
                        if (subgraphNode.nodeId === draft.nodeId) {
                            Object.assign(subgraphNode, draft)
                            return
                        }
                        getRelationshipEntries(subgraphNode).forEach(([_relationshipKey, nodeMap]) => {
                            Object.entries(nodeMap).forEach(([_nodeId, value]) => {
                                findAndReplace(value as WritableDraft<GenericMergeOutputTree>)
                            })
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
            const {previousData} = context as {previousData: [string, GenericMergeOutputTree][]}
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
    useEffect(() => {
        if (!subgraph || mutation.isPending) return
        updateDraft(((initializeDraft && subgraph) 
            ? initializeDraft(subgraph, (initializedDraft) => initializedDraft) 
            : subgraph
        ) as any)
    }, [subgraph])
    return {
        ...queryResult,
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
`


