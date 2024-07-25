
import { extractSubgraph } from "../uix/generated/functionModule"
import { ConfiguredNodeDefinitionMap } from "../uix/generated/staticObjects"
import {AnyExtractionSubgraph, ExtractionSubgraph, ExtractionOptions, RootExtractionNode, QueryError} from "@thinairthings/uix"
import {useQuery} from "@tanstack/react-query"
export const useUix = <
    NodeType extends keyof ConfiguredNodeDefinitionMap,
    ReferenceType extends 'nodeType' | 'nodeIndex',
    TypedSubgraph extends AnyExtractionSubgraph,
>(params: ({
    nodeType: NodeType
}) & (
        ReferenceType extends 'nodeType'
        ? ({
            referenceType: ReferenceType
            options?: ExtractionOptions
        }) : ({
            referenceType: ReferenceType
            indexKey: ConfiguredNodeDefinitionMap[NodeType]['uniqueIndexes'][number]
            indexValue: string
        })
    ) & ({
        subgraphSelector: (subgraph: ExtractionSubgraph<ConfiguredNodeDefinitionMap, `n_0_0`, readonly [
            RootExtractionNode<ConfiguredNodeDefinitionMap, NodeType>
        ]>) => TypedSubgraph
    })
) => {
    const {data} = useQuery({
        queryKey: ['uix', params],
        queryFn: async () => {
            const result = await extractSubgraph(params)
            if (result.error) throw new QueryError(result.error)
            return result.data
        }
    })
    return data
}

const out = useUix({
    'nodeType': 'User',
    'referenceType': 'nodeType',
    'subgraphSelector': (subgraph) => subgraph
})

if (out) {
    out.
}