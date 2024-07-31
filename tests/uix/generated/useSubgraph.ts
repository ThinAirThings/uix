
'use client'
import { useQuery } from "@tanstack/react-query"
import { ConfiguredNodeDefinitionMap, nodeDefinitionMap } from "./staticObjects"
import { SubgraphDefinition, SubgraphPathDefinition, QueryError, GenericNodeShapeTree, AnySubgraphDefinition} from "@thinairthings/uix"
import { extractSubgraph } from "./functionModule"
import { useSubgraphDraft } from "./useSubgraphDraft"
const getRelationshipEntries = (subgraph: object) => Object.entries(subgraph).filter(([key]) => key.includes('->') || key.includes('<-'))
export const cacheKeyMap = new Map<string, Set<string>>()
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
    defineSubgraph?: (subgraph: SubgraphDefinition<
        ConfiguredNodeDefinitionMap, 
        [SubgraphPathDefinition<
            ConfiguredNodeDefinitionMap,
            RootNodeType,
            []
        >]>
    ) => SubgraphDefinitionRef
) => {
    const { data: subgraph, error, isPending, isSuccess } = useQuery({
        queryKey: [{rootNode, subgraphDefinition: defineSubgraph?.(new SubgraphDefinition(
            nodeDefinitionMap,
            [new SubgraphPathDefinition(
                nodeDefinitionMap,
                rootNode.nodeType,
                []
            )]
        )).serialize()}],
        queryFn: async ({queryKey: [params]}) => {
            const result = await extractSubgraph(params.rootNode, params.subgraphDefinition)
            if (result.error) throw new QueryError(result.error)
            const subgraph = result.data as GenericNodeShapeTree
            const addNodeToCache = (node: GenericNodeShapeTree) => {
                cacheKeyMap.set(
                    node.nodeId as string, 
                    cacheKeyMap.get(node.nodeId as string) 
                        ? cacheKeyMap.get(node.nodeId as string)!.add(JSON.stringify(params)) 
                        : new Set<string>([JSON.stringify(params)])
                )
                getRelationshipEntries(node).forEach(([key, value]) => {
                    if (Array.isArray(value)) {
                        value.forEach(addNodeToCache)
                    } else {
                        addNodeToCache(value)
                    }
                })
            }
            addNodeToCache(subgraph)
            return result.data 
        }
    })
    const {
        draft,
        updateDraft,
        isSaving,
        isSuccess: isSaveSuccess,
        save
    } = useSubgraphDraft(subgraph)
    return {
        subgraph,
        error,
        isPending,
        isSuccess,
        draft,
        updateDraft,
        isSaving,
        isSaveSuccess,
        save
    }
}
