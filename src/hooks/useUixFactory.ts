import { AnyZodObject, z, ZodObject, ZodTypeAny } from "zod"
import { AnyNodeDefinitionMap, NodeState } from "../definitions/NodeDefinition"
import { AnySubgraphDefinition, SubgraphDefinition } from "../definitions/SubgraphDefinition"
import { SubgraphPathDefinition } from "../definitions/SubgraphPathDefinition"
import { ExtractOutputTree, ExtractOutputTreeOmitRelationshipMetadata } from "../types"
import { MergeInputTree } from "../types/MergeInputTree"
import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { extractSubgraphFactory, GenericMergeOutputTree } from "../fns/extractSubgraphFactory"
import { QueryError } from "../types/Result"
import { getRelationshipEntries } from "../utilities"
import {useImmer} from "@thinairthings/use-immer"
import { mergeSubgraphFactory } from "../fns/mergeSubgraphFactory"
import { produce, WritableDraft } from "immer"
import { useEffect } from "react"
import { createNestedZodSchema } from "../utilities/createNestedZodSchema"


export const cacheKeyMap = new Map<string, Set<string>>()
export const useUixFactory = <
    NodeDefinitionMap extends AnyNodeDefinitionMap,
>(
    nodeDefinitionMap: NodeDefinitionMap
) => <
    RootNodeType extends keyof NodeDefinitionMap,
    SubgraphIndex extends ({
        [UniqueIndex in NodeDefinitionMap[RootNodeType]['uniqueIndexes'][number]]?: string
    }),
    SubgraphDefinitionRef extends AnySubgraphDefinition,
    Data extends (MergeInputTree<NodeDefinitionMap, RootNodeType>) | ExtractOutputTree<NodeDefinitionMap, SubgraphDefinitionRef, RootNodeType>= ExtractOutputTree<NodeDefinitionMap, SubgraphDefinitionRef, RootNodeType>
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
        NodeDefinitionMap, 
        [SubgraphPathDefinition<
            NodeDefinitionMap,
            RootNodeType,
            []
        >]>
    ) => SubgraphDefinitionRef,
    modifySchema?: (stateSchema: NodeDefinitionMap[RootNodeType]['stateSchema']) => ZodObject<{
        [K in keyof NodeState<NodeDefinitionMap[RootNodeType]>]: ZodTypeAny
    }>,
    initializeDraft?: (
        data: ExtractOutputTreeOmitRelationshipMetadata<NodeDefinitionMap, SubgraphDefinitionRef, RootNodeType>,
        initialize: <T extends MergeInputTree<NodeDefinitionMap, RootNodeType>>(freeze: T) => T
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
        const result = await extractSubgraphFactory(nodeDefinitionMap)(params!.rootNodeIndex, params!.subgraphDefinition)
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
        K extends `-${string}->${string}`|`<-${string}-${string}`
            ? {
                [Id in keyof DraftTree[K]]: DraftErrorTree<DraftTree[K][Id]> 
            }
            : string
    }
    const [draftErrors, setDraftErrors] = useImmer({} as DraftErrorTree<Data>)


    const mutation = useMutation({
    mutationFn: async () => {
        if (!draft || !subgraph) return
        await mergeSubgraphFactory(nodeDefinitionMap)(draft as any)
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


