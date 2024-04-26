import { defineNode } from "@/src/base/defineNode";
import { unstable_cache as cache, revalidateTag } from 'next/cache'
import { TypeOf, ZodObject } from "zod";
import { GraphLayer } from "@/src/types/GraphLayer";
import { NextjsCacheLayerError } from "./NextjsCacheLayerError";



export const defineNextjsCacheLayer = <
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
>(
    graph: GraphLayer<N, R, E, UIdx>,
): GraphLayer<N, R, E, UIdx, NextjsCacheLayerError> => {
    const cacheMap = new Map<string, ReturnType<typeof cache>>
    return {
        ...graph,
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
            const nodeResult = await graph.updateNode({ nodeType, nodeId }, state)
            if (!nodeResult.ok) {
                return nodeResult
            }
            graph.uniqueIndexes[nodeType]!
                .map((indexKey: any) => `${nodeType}-${indexKey as string}-${nodeResult.val[indexKey]}`)
                .forEach(revalidateTag)
            return nodeResult
        }
    }
}