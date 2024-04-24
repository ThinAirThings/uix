import { defineNode } from "@/src/base/defineNode";
import { Neo4jLayer } from "../Neo4j/Neo4jLayer";
import { unstable_cache as cache, revalidateTag } from 'next/cache'
import { defineGraph } from "@/src/base/defineGraph";



export const NextjsCacheLayer = <
    N extends readonly ReturnType<typeof defineNode< any, any>>[],
    G extends ReturnType<typeof Neo4jLayer<N, ReturnType<typeof defineGraph<N, any>>, any>>
>(
    graph: G
): Pick<G, 'getNode' | 'updateNode'> => {
    const cacheMap = new Map<string, ReturnType<typeof cache>>
    const uniqueIndexes = graph['uniqueIndexes'] as { [nodeType: string]: string[] }
    return {
        getNode: async (nodeType, nodeIndex, indexKey) => {
            const cacheKey = `${nodeType}-${nodeIndex}-${indexKey}`
            if (!cacheMap.has(cacheKey)) {
                cacheMap.set(cacheKey, cache(
                    async (...[nodeType, index, key]: Parameters<typeof graph.getNode>) => {
                        return await graph.getNode(nodeType, index, key)
                    }, [cacheKey], {
                    tags: [cacheKey]
                }
                ))
            }
            const node = await graph.getNode(nodeType, nodeIndex, indexKey)
            return node
        },
        updateNode: async ({ nodeType, nodeId }, state) => {
            const node = await graph.updateNode({ nodeType, nodeId }, state)
            uniqueIndexes[nodeType]
                .map(indexKey => `${nodeType}-${indexKey}-${node[indexKey]}`)
                .forEach(revalidateTag)
            return node
        }
    }
}