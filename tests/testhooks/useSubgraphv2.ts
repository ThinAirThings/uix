
import {AnyExtractionSubgraph, ExtractionSubgraph, ExtractionOptions, RootExtractionNode, QueryError, NodeShape, SubgraphTree, RelationshipShape, GenericNodeKey, AnySubgraphSpecification} from "@thinairthings/uix"
import { useMutation, useQuery, useQueryClient} from "@tanstack/react-query"
import { createImmerState } from "@thinairthings/utilities";
import { ConfiguredNodeDefinitionMap, nodeDefinitionMap } from "../uix/generated/staticObjects";
import { extractSubgraph, mergeSubgraph } from "../uix/generated/functionModule";
import {useImmer} from "@thinairthings/use-immer"
const subgraphStore = createImmerState({
    nodeMap: new Map<string, NodeShape<ConfiguredNodeDefinitionMap[keyof ConfiguredNodeDefinitionMap]>>(),
})

export const cacheKeyMap = new Map<string, any>()

export const useSubgraph = <
    NodeType extends keyof ConfiguredNodeDefinitionMap,
    ReferenceType extends 'nodeType' | 'nodeIndex' = 'nodeIndex',
    TypedSubgraph extends AnyExtractionSubgraph | undefined = undefined
>(params: (({
    nodeType: NodeType
}) & (
        ReferenceType extends 'nodeType'
        ? ({
            referenceType: `${ReferenceType}`
            options?: ExtractionOptions
        }) : ({
            referenceType: ReferenceType
            indexKey: ConfiguredNodeDefinitionMap[NodeType]['uniqueIndexes'][number]
            indexValue: string
        })
    ) & ({
        subgraphSelector?: (subgraph: ExtractionSubgraph<ConfiguredNodeDefinitionMap, `n_0_0`, readonly [
            RootExtractionNode<ConfiguredNodeDefinitionMap, NodeType>
        ]>) => TypedSubgraph
    }))
) => {
    type SubgraphType = ReferenceType extends 'nodeIndex'
        ? TypedSubgraph extends AnyExtractionSubgraph
            ? NodeShape<ConfiguredNodeDefinitionMap[NodeType]> & SubgraphTree<ConfiguredNodeDefinitionMap, TypedSubgraph>
            : NodeShape<ConfiguredNodeDefinitionMap[NodeType]>
        : TypedSubgraph extends AnyExtractionSubgraph
            ? (NodeShape<ConfiguredNodeDefinitionMap[NodeType]> & SubgraphTree<ConfiguredNodeDefinitionMap, TypedSubgraph>)[]
            : NodeShape<ConfiguredNodeDefinitionMap[NodeType]>[]
    const { data: subgraph, error, isPending, isSuccess } = useQuery({
        queryKey: [
            params, 
            // params.subgraphSelector?.(ExtractionSubgraph.create(nodeDefinitionMap, params.nodeType))?.getQueryTree()
        ],
        //@ts-ignore
        queryFn: async () => {
            console.log("RUNNING QUERY")
            const result = await extractSubgraph(params) 
            if (result.error) throw new QueryError(result.error)
            // Create queryKeyTree 
            const subgraph = result.data as SubgraphType
            // Add Cache Keys
            type KeySet = {
                nodeId: string,
                relatedNodeId: string
            } | {[relationship: string]: KeySet | KeySet[]}
            const addCacheKeys = (subgraph: KeySet) => {
                console.log("Adding Cache Keys", subgraph.nodeId, subgraph.relatedNodeId)
                cacheKeyMap.set(`${subgraph.nodeId}`, params)
                subgraph.relatedNodeId && cacheKeyMap.set(`${subgraph.nodeId}-${subgraph.relatedNodeId}`, params)
                Object.keys(subgraph).filter(key => key.includes('<-') || key.includes('->')).forEach(key => {
                    if (Array.isArray(subgraph[key])) {
                        subgraph[key].forEach((item: KeySet) => addCacheKeys(item))
                    } else {
                        addCacheKeys(subgraph[key] as KeySet)
                    }
                })
            }
            addCacheKeys(subgraph as KeySet)
            return subgraph
        },
    })
    return {
        subgraph,
        error,
        isPending,
        isSuccess
    }
}


export const useMerge = <
    NodeType extends keyof ConfiguredNodeDefinitionMap,
    SubgraphSpecificationRef extends AnySubgraphSpecification | undefined,
    Subgraph extends SubgraphSpecificationRef extends AnySubgraphSpecification 
        ? NodeShape<ConfiguredNodeDefinitionMap[NodeType]> & (SubgraphSpecificationRef extends AnySubgraphSpecification 
            ? SubgraphTree<ConfiguredNodeDefinitionMap, SubgraphSpecificationRef>
            : unknown)
        : {nodeType: NodeType, nodeId?: string}
>(
    node: T
) => {
    const queryClient = useQueryClient()
    const [draft, updateDraft] = useImmer(node)
    const updateMutation = useMutation({
        mutationFn: async (state: Partial<T>) => {
            const currentNodeData = queryClient.getQueryData(
                node.relatedNodeId ? cacheKeyMap.get(`${node.relatedNodeId}-${node.nodeId}`) : cacheKeyMap.get(`${node.nodeId}`)
            ) as NodeShape<ConfiguredNodeDefinitionMap[keyof ConfiguredNodeDefinitionMap]>
            if (!currentNodeData) return
            console.log("Running Mutation: ", 'updateNode({ nodeType: ' + node.nodeType + 'nodeId: ' + node.nodeId + state)
            return await mergeSubgraph({
                operation: 'update',
                nodeType: currentNodeData.nodeType,
                nodeId: currentNodeData.nodeId,
                state: nodeDefinitionMap[currentNodeData.nodeType].stateSchema.parse(state),
                weakRelationshipMap: {

                },  
                nodeKey: { nodeType: currentNodeData.nodeType, nodeId: currentNodeData.nodeId }, 
                inputState
            })
        },
        onMutate: async (data) => {
            await queryClient.cancelQueries({ queryKey: queryOptions.queryKey })
            const previousData = queryClient.getQueryData(queryOptions.queryKey)
            queryClient.setQueryData(queryOptions.queryKey, (oldData) => {
                if (!oldData) return
                return produce(oldData, draftData => {
                    Object.assign(draftData, data)
                })
            })
            return { previousData }
        },
        onError: (err, newData, context) => {
            queryClient.setQueryData(queryOptions.queryKey, context?.previousData)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryOptions.queryKey
            })
        }
    })
    return {
        draft,
        updateDraft
    }
}