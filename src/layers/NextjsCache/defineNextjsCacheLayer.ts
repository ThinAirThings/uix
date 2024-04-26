import { defineNode } from "@/src/base/defineNode";
import { unstable_cache as cache, revalidateTag } from 'next/cache'
import { TypeOf, ZodObject } from "zod";
import { GraphLayer } from "@/src/types/GraphLayer";
import { NextjsCacheLayerError } from "./NextjsCacheLayerError";
import { Err, Ok } from "ts-results";


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
        // You need this to force the user to use getNode after creation. If you don't, then they could be stuck with a null value after creation.
        createNode: async (nodeType, initialState) => {
            const createNodeResult = await graph.createNode(nodeType, initialState)
            if (!createNodeResult.ok) {
                return createNodeResult
            }
            // Get the node so you can invalidate all the caches.
            const getNodeResult = await graph.getNode(nodeType, 'nodeId', createNodeResult.val.nodeId)
            if (!getNodeResult.ok) return getNodeResult;
            const node = getNodeResult.val;
            // Invalidate all caches for the node, remember react will have run through the tree and tried all of the getNodes which returned null.
            (['nodeId', ...graph.uniqueIndexes[nodeType] ?? []] as string[])
                .map((indexKey) => `${nodeType}-${indexKey}-${node[indexKey]}`)
                .forEach((cacheKey) => {
                    console.log(`Created with cache key: ${cacheKey}`)
                    revalidateTag(cacheKey)
                })
            // Return the nodekey
            return new Ok({ nodeType: node.nodeType, nodeId: node.nodeId })
        },
        createRelationship: async (fromNode, relationshipType, toNode, ...args) => {
            // Handle passing Result type in as toNode for common pattern
            if (toNode instanceof Err) return toNode
            if (toNode instanceof Ok) toNode = toNode.val
            const createRelationshipResult = await graph.createRelationship(fromNode, relationshipType, toNode, ...args)
            if (!createRelationshipResult.ok) {
                return createRelationshipResult
            }
            // Invalidate all caches for the fromNode and toNode
            const cacheKey = `${fromNode.nodeId}-${relationshipType}-${toNode.nodeType}`
            revalidateTag(cacheKey)
            return createRelationshipResult
        },
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
                console.log(`Related to node cache key: ${cacheKey}`)

            })

            return getRelatedToNodesResult
        },
        updateNode: async ({ nodeType, nodeId }, state) => {
            const nodeResult = await graph.updateNode({ nodeType, nodeId }, state)
            if (!nodeResult.ok) {
                return nodeResult
            }
            (['nodeId', ...graph.uniqueIndexes[nodeType] ?? []] as string[])
                .map((indexKey) => `${nodeType}-${indexKey}-${nodeResult.val[indexKey]}`)
                .forEach((cacheKey) => {
                    console.log(`Updated with cache key: ${cacheKey}`)
                    revalidateTag(cacheKey)
                })
            return nodeResult
        },

    }
}