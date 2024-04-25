import { defineNode } from "@/src/base/defineNode";
import { unstable_cache as cache, revalidateTag } from 'next/cache'
import { TypeOf, ZodObject } from "zod";
import { GraphLayer } from "@/src/types/Graph";



export const NextjsCacheLayer = <
    N extends readonly ReturnType<typeof defineNode<any, any>>[],
    R extends readonly {
        relationshipType: Uppercase<string>
        stateDefinition?: ZodObject<any>
    }[],
    E extends { [NT in (N[number]['nodeType'])]?: {
        [RT in R[number]['relationshipType']]?: readonly N[number]['nodeType'][]
    } },
    UIdx extends {
        [T in N[number]['nodeType']]?: readonly (keyof TypeOf<(N[number] & { nodeType: T })['stateDefinition']>)[]
    },
    G extends Pick<GraphLayer<N, R, E, UIdx>, 'getNode' | 'updateNode'>
>(graph: G, {
    nodeDefinitions,
    relationshipDefinitions,
    edgeDefinitions,
    uniqueIndexes
}: {
    nodeDefinitions: N
    relationshipDefinitions: R,
    edgeDefinitions: E,
    uniqueIndexes: UIdx
}): Pick<GraphLayer<N, R, E, UIdx>, 'getNode' | 'updateNode'> => {
    const cacheMap = new Map<string, ReturnType<typeof cache>>
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
            uniqueIndexes[nodeType]!
                .map((indexKey: any) => `${nodeType}-${indexKey as string}-${node[indexKey]}`)
                .forEach(revalidateTag)
            return node
        }
    }
}