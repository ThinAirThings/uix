import { useQuery } from "@tanstack/react-query"
import { AnySubgraphDefinition } from "../../dist/lib"
import { ConfiguredNodeDefinitionMap } from "../uix/generated/staticObjects"
import { SubgraphDefinition, SubgraphPathDefinition, QueryError, SubgraphTree} from "@thinairthings/uix"
import { extractSubgraph } from "../uix/generated/functionModule"





export const useSubgraph = <
    RootNodeType extends keyof ConfiguredNodeDefinitionMap,
    SubgraphIndex extends ({
        [UniqueIndex in ConfiguredNodeDefinitionMap[RootNodeType]['uniqueIndexes'][number]]?: string
    }),
    SubgraphDefinitionRef extends AnySubgraphDefinition
>(
    rootNode: (({
        nodeType: RootNodeType
    }) & SubgraphIndex),
    defineSubgraph: (subgraph: SubgraphDefinition<
        ConfiguredNodeDefinitionMap, 
        [SubgraphPathDefinition<
            ConfiguredNodeDefinitionMap,
            RootNodeType,
            []
        >]>
    ) => SubgraphDefinitionRef
) => {
    const { data: subgraph, error, isPending, isSuccess } = useQuery({
        queryKey: [rootNode],
        queryFn: async () => {
            const result = await extractSubgraph(rootNode, defineSubgraph)
            if (result.error) throw new QueryError(result.error)
            return result.data
        }
    })
    return {
        subgraph,
        error,
        isPending,
        isSuccess
    }
}

const {subgraph} = useSubgraph({
    'nodeType': 'User',
    'email': 'dan.lannan@thinair.cloud'
}, (subgraph) => subgraph
    .extendPath('User', '-ACCESS_TO->Organization')
    .extendPath('User-ACCESS_TO->Organization', '<-BELONGS_TO-Project')
    .extendPath('User-ACCESS_TO->Organization<-BELONGS_TO-Project', '<-ACCESS_TO-User')
    .extendPath('User', '<-CONVERSATION_BETWEEN-Chat')
    .extendPath('User<-CONVERSATION_BETWEEN-Chat', '-CONVERSATION_BETWEEN->User')
)
