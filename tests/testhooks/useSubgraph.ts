
import {AnyExtractionSubgraph, ExtractionSubgraph, ExtractionOptions, RootExtractionNode, QueryError, NodeShape, SubgraphTree, RelationshipShape} from "@thinairthings/uix"
import { QueryClient, useQuery, useQueryClient} from "@tanstack/react-query"
import { createImmerState } from "@thinairthings/utilities";
import { ConfiguredNodeDefinitionMap, nodeDefinitionMap, NodeKey } from "../uix/generated/staticObjects";
import { extractSubgraph } from "../uix/generated/functionModule";

const subgraphStore = createImmerState({
    nodeMap: new Map<string, NodeShape<ConfiguredNodeDefinitionMap[keyof ConfiguredNodeDefinitionMap]>>(),
})

export const useSubgraph = <
    NodeType extends keyof ConfiguredNodeDefinitionMap,
    ReferenceType extends 'nodeType' | 'nodeIndex' = 'nodeIndex',
    TypedSubgraph extends AnyExtractionSubgraph | undefined = undefined,
    Data = ReferenceType extends 'nodeIndex'
    ? TypedSubgraph extends AnyExtractionSubgraph
        ? NodeShape<ConfiguredNodeDefinitionMap[NodeType]> & SubgraphTree<ConfiguredNodeDefinitionMap, TypedSubgraph>
        : NodeShape<ConfiguredNodeDefinitionMap[NodeType]>
    : TypedSubgraph extends AnyExtractionSubgraph
        ? (NodeShape<ConfiguredNodeDefinitionMap[NodeType]> & SubgraphTree<ConfiguredNodeDefinitionMap, TypedSubgraph>)[]
        : NodeShape<ConfiguredNodeDefinitionMap[NodeType]>[]
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
        selector?: (data: ReferenceType extends 'nodeIndex'
            ? TypedSubgraph extends AnyExtractionSubgraph
                ? NodeShape<ConfiguredNodeDefinitionMap[NodeType]> & SubgraphTree<ConfiguredNodeDefinitionMap, TypedSubgraph>
                : NodeShape<ConfiguredNodeDefinitionMap[NodeType]>
            : TypedSubgraph extends AnyExtractionSubgraph
                ? (NodeShape<ConfiguredNodeDefinitionMap[NodeType]> & SubgraphTree<ConfiguredNodeDefinitionMap, TypedSubgraph>)[]
                : NodeShape<ConfiguredNodeDefinitionMap[NodeType]>[]) => Data
    }))
    //  | ({
    //     nodeShape: NodeKey<NodeType>
    //     selector?: (data: NodeShape<ConfiguredNodeDefinitionMap[NodeType]>) => Data
    // })
) => {

    const { data, error, isPending, isSuccess } = useQuery({
        queryKey: [...'referenceType' in params ? [
            params, 
            // params.subgraphSelector?.(ExtractionSubgraph.create(nodeDefinitionMap, params.nodeType))?.getQueryTree()
        ] : [
            // params.nodeShape.nodeId, params.nodeShape
        ]],
        //@ts-ignore
        queryFn: async () => {
            console.log("RUNNING QUERY")
            const result = 'referenceType' in params 
                ? await extractSubgraph(params) 
                : null as any
                // await extractSubgraph({
                //     nodeType: params.nodeShape.nodeType,
                //     referenceType: 'nodeIndex',
                //     indexKey: 'nodeId',
                //     indexValue: params.nodeShape.nodeId,
                // })
            if (result.error) throw new QueryError(result.error)
            // Create queryKeyTree
            
            return result.data as ReferenceType extends 'nodeIndex'
                ? TypedSubgraph extends AnyExtractionSubgraph
                    ? NodeShape<ConfiguredNodeDefinitionMap[NodeType]> & SubgraphTree<ConfiguredNodeDefinitionMap, TypedSubgraph>
                    : NodeShape<ConfiguredNodeDefinitionMap[NodeType]>
                : TypedSubgraph extends AnyExtractionSubgraph
                    ? (NodeShape<ConfiguredNodeDefinitionMap[NodeType]> & SubgraphTree<ConfiguredNodeDefinitionMap, TypedSubgraph>)[]
                    : NodeShape<ConfiguredNodeDefinitionMap[NodeType]>[]
        },
        select: params.selector
    })
    return {
        data,
        error,
        isPending,
        isSuccess
    }
}

// NOTE! You can do type level hook loops, but not node level hook loops
export const useNode = <
    N extends NodeShape<ConfiguredNodeDefinitionMap[keyof ConfiguredNodeDefinitionMap]> 
        & ({relationship?: `${string}-${string}->${string}` | `${string}<-${string}-${string}`}),
    Data = N
>(
    nodeData: N,
    selector?: (node: N) => Data
) => {

    const {data, error, isPending} = useQuery({
        queryKey: [nodeData.nodeId],
        queryFn: async () => {
            const result = await extractSubgraph({
                nodeType: nodeData.nodeType,
                indexKey: 'nodeId',
                indexValue: nodeData.nodeId,
                referenceType: 'nodeIndex',
            })
            if (result.error) throw new QueryError(result.error)
            return result.data as N
        },
        select: selector
    })
    return {data, error, isPending}
}
