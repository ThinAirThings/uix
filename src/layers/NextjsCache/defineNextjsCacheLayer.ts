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
    const cacheMap = new Map<string, ReturnType<typeof cache>>()
    return {
        ...graph,
        getNode: async (nodeType, nodeIndex, indexKey) => {
            const uniqueIndexes = ['nodeId', ...graph.uniqueIndexes[nodeType] ?? []] as string[]
            const cacheKeys = uniqueIndexes.map(index => `${nodeType}-${index}-${indexKey}`)
            // Create caches for each unique index
            cacheKeys.forEach(cacheKey => !cacheMap.has(cacheKey) && cacheMap.set(cacheKey, cache(
                async (...[nodeType, index, key]: Parameters<typeof graph.getNode>) => {
                    return await graph.getNode(nodeType, index, key)
                }, [cacheKey], {
                tags: [cacheKey]
            })))
            // Use index 0, but either would work.
            const node = await cacheMap.get(cacheKeys[0])!(nodeType, nodeIndex, indexKey) as ReturnType<typeof graph.getNode>
            return node
        },
        getRelatedTo: async (fromNode, relationshipType, toNodeType) => {
            // I'm not sure if this first one is needed.
            const cacheKey = `${fromNode.nodeId}-${relationshipType}-${toNodeType}`
            if (!cacheMap.has(cacheKey)) {
                cacheMap.set(cacheKey, cache(
                    async (...[fromNode, relationshipType, toNodeType]: Parameters<typeof graph.getRelatedTo>) => {
                        return await graph.getRelatedTo(fromNode, relationshipType, toNodeType)
                    }, [cacheKey], {
                    tags: [cacheKey]
                }))
            }
            const getRelatedToNodesResult = await cacheMap.get(cacheKey)!(fromNode, relationshipType, toNodeType) as Awaited<ReturnType<typeof graph.getRelatedTo>>
            if (!getRelatedToNodesResult.ok) {
                return getRelatedToNodesResult
            }
            // Create caches for each unique index and returned node. This will invalidate the cache if any of the returned nodes are updated.
            const toNodeTypeUniqueIndexes = ['nodeId', ...graph.uniqueIndexes[toNodeType] ?? []] as string[]
            const relatedToNodes = getRelatedToNodesResult.val
            const relatedToNodeCacheKeys = relatedToNodes.map((node) => toNodeTypeUniqueIndexes.map(index => `${toNodeType}-${index as string}-${node[index]}`)).flat()
            relatedToNodeCacheKeys.forEach(cacheKey => {
                !cacheMap.has(cacheKey) && cacheMap.set(cacheKey, cache(
                    async (...[nodeType, index, key]: Parameters<typeof graph.getNode>) => {
                        return await graph.getNode(nodeType, index, key)
                    }, [cacheKey], {
                    tags: [cacheKey]
                }))
                console.log(cacheKey)

            })

            return getRelatedToNodesResult
        },
        updateNode: async ({ nodeType, nodeId }, state) => {
            const nodeResult = await graph.updateNode({ nodeType, nodeId }, state)
            if (!nodeResult.ok) {
                return nodeResult
            }
            (['nodeId', ...graph.uniqueIndexes[nodeType] ?? []] as string[])
                .map((indexKey: any) => `${nodeType}-${indexKey as string}-${nodeResult.val[indexKey]}`)
                .forEach(revalidateTag)
            return nodeResult
        },

    }
}