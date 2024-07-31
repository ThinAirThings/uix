import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ConfiguredNodeDefinitionMap } from "../uix/generated/staticObjects";
import { NodeShape, NodeState, NodeStateTree, NodeShapeTree, GenericNodeShape, GenericNodeShapeTree } from "@thinairthings/uix";
import { Draft, produce, WritableDraft } from "immer";
import { mergeSubgraph } from "../uix/generated/functionModule";
import { useImmer } from "@thinairthings/use-immer";
import { cacheKeyMap } from "./useSubgraphv4";


export const useMerge = <
    NodeType extends keyof ConfiguredNodeDefinitionMap,
    Subgraph extends 
        | NodeState<ConfiguredNodeDefinitionMap[NodeType]>
>(subgraph: (
    ({
        nodeType: NodeType
    }) & Subgraph 
)) => {
    const queryClient = useQueryClient()
    const [draft, updateDraft] = useImmer(subgraph as (NodeStateTree<ConfiguredNodeDefinitionMap, NodeType>))
    const mutation = useMutation({
        mutationFn: async () => {
            console.log("Inside mutationFn")
            console.log("Mutating with draft:", draft)
            const {data, error} = await mergeSubgraph(draft as any)
            return null as any
        },
        onMutate: async () => {
            console.log("Inside onMutate Function")
            const getRelationshipEntries = (subgraph: object) => Object.entries(subgraph).filter(([key]) => key.includes('->') || key.includes('<-'))
            const previousSubgraphEntries = [...cacheKeyMap.get(draft.nodeId as string)!.values()]
                .map(paramString => [
                    paramString, 
                    queryClient.getQueryData([JSON.parse(paramString)])
                ] as const) as [string, GenericNodeShapeTree][]
            previousSubgraphEntries.forEach(([paramString, previousSubgraph]) => {
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
            [...cacheKeyMap.get(draft.nodeId as string)!.values()].forEach(paramString => {
                queryClient.invalidateQueries({
                    queryKey: [JSON.parse(paramString)]
                })
            })
        }
    })
    return {
        draft, 
        updateDraft,
        isSaving: mutation.isPending,
        isSuccess: mutation.isSuccess,
        save: mutation.mutate
    }
}