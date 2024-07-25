



import { extractSubgraph } from "../uix/generated/functionModule"
import { ConfiguredNodeDefinitionMap } from "../uix/generated/staticObjects"
import {AnyExtractionSubgraph, ExtractionSubgraph, ExtractionOptions, RootExtractionNode, QueryError, NodeShape, SubgraphTree} from "@thinairthings/uix"
import { useQuery} from "@tanstack/react-query"


export const useSubgraph = <
    NodeType extends keyof ConfiguredNodeDefinitionMap,
    ReferenceType extends 'nodeType' | 'nodeIndex',
    TypedSubgraph extends AnyExtractionSubgraph | undefined = undefined,
>(params: ({
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
    })
) => {
    const { data, error, isPending } = useQuery({
        queryKey: ['uix', params],
        queryFn: async () => {
            const result = await extractSubgraph(params)
            if (result.error) throw new QueryError(result.error)
            return result.data as ReferenceType extends 'nodeIndex'
            ? TypedSubgraph extends AnyExtractionSubgraph
                ? NodeShape<ConfiguredNodeDefinitionMap[NodeType]> & SubgraphTree<ConfiguredNodeDefinitionMap, TypedSubgraph>
                : NodeShape<ConfiguredNodeDefinitionMap[NodeType]>
            : TypedSubgraph extends AnyExtractionSubgraph
                ? (NodeShape<ConfiguredNodeDefinitionMap[NodeType]> & SubgraphTree<ConfiguredNodeDefinitionMap, TypedSubgraph>)[]
                : NodeShape<ConfiguredNodeDefinitionMap[NodeType]>[]
        }}
    )
    return {
        data,
        error,
        isPending
    }
}

const {data, error, isPending} = useSubgraph({
    nodeType: 'User',
    referenceType: 'nodeType',
    'subgraphSelector': (subgraph) => subgraph
        .addNode('-ACCESS_TO->Organization')
})

const data2 = await extractSubgraph({
    'nodeType': 'User',
    'referenceType': 'nodeType',
    // 'subgraphSelector': (subgraph) => subgraph
})
if (data2) {
    data2.data?.map(node => node)
}
if (data) {
    data.map(node => node["-ACCESS_TO->Organization"].map(node => node.))
}

