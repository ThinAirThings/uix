import { defineNode } from "@/src/base/defineNode";
import { unstable_cache as cache, revalidateTag } from 'next/cache'
import { TypeOf, ZodObject } from "zod";
import { GraphLayer } from "@/src/types/GraphLayer";
import { NextjsCacheLayerError } from "./NextjsCacheLayerError";
import { Err, Ok } from "ts-results";
import { GraphNodeType } from "@/src/types/GraphNodeType";


export const defineNextjsCacheLayer = <
    N extends readonly ReturnType<typeof defineNode<any, any>>[],
    R extends readonly {
        relationshipType: Uppercase<string>
        uniqueFromNode?: boolean
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
    const invalidationFnKeys = ['getNode', 'getRelatedTo'] as const
    const invalidateCacheKeys = (node: GraphNodeType<typeof graph, N[number]['nodeType']>) => {
        const uniqueIndexes = ['nodeId', ...graph.uniqueIndexes[node.nodeType] ?? []] as string[]
        const cacheKeys = uniqueIndexes.map(index => invalidationFnKeys.map(fnKey => `${fnKey}-${node.nodeType}-${index}-${node[index]}`)).flat()
        cacheKeys.forEach(cacheKey => {
            console.log(`InvalidateCacheKeys: ${cacheKey}`)
        })

        cacheKeys.forEach(cacheKey => {
            revalidateTag(cacheKey)
        })
    }

    return {
        ...graph,
        // Get node has an explicit cache key
        getNode: async (nodeType, nodeIndex, indexKey) => {
            const cacheKey = `getNode-${nodeType}-${nodeIndex}-${indexKey}`
            // Create caches for each unique index
            !cacheMap.has(cacheKey) && cacheMap.set(cacheKey, cache(
                async (...[nodeType, index, key]: Parameters<typeof graph.getNode>) => {
                    return await graph.getNode(nodeType, index, key)
                }, [cacheKey], {
                tags: [cacheKey]
            }))
            // Use index 0, but either would work.
            const node = await cacheMap.get(cacheKey)!(nodeType, nodeIndex, indexKey) as ReturnType<typeof graph.getNode>
            return node
        },
        getRelatedTo: async (fromNode, relationshipType, toNodeType) => {
            // Set explicit cache key
            const cacheKey = `getRelatedTo-${fromNode.nodeId}-${relationshipType}-${toNodeType}`
            !cacheMap.has(cacheKey) && cacheMap.set(cacheKey, cache(
                async (...[fromNode, relationshipType, toNodeType]: Parameters<typeof graph.getRelatedTo>) => {
                    return await graph.getRelatedTo(fromNode, relationshipType, toNodeType)
                }, [cacheKey], {
                tags: [cacheKey]
            }))
            // Get the related nodes
            const getRelatedToNodesResult = await cacheMap.get(cacheKey)!(fromNode, relationshipType, toNodeType) as Awaited<ReturnType<typeof graph.getRelatedTo>>
            if (!getRelatedToNodesResult.ok) {
                return getRelatedToNodesResult
            }
            // Create caches for each unique index and returned node. This will invalidate the cache if any of the returned nodes are updated.
            const toNodeTypeUniqueIndexes = ['nodeId', ...graph.uniqueIndexes[toNodeType] ?? []] as string[]
            const relatedToNodes = getRelatedToNodesResult.val
            const relatedToNodeCacheKeys = relatedToNodes.map((node) => toNodeTypeUniqueIndexes.map(index => `getRelatedTo-${toNodeType}-${index}-${node[index]}`)).flat()
            relatedToNodeCacheKeys.forEach(cacheKey => {
                !cacheMap.has(cacheKey) && cacheMap.set(cacheKey, cache(
                    async () => {
                        return await graph.getRelatedTo(fromNode, relationshipType, toNodeType)
                    }, [cacheKey], {
                    tags: [cacheKey]
                }))
                console.log(`Related to node cache key: ${cacheKey}`)
            })
            return getRelatedToNodesResult
        },
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
            invalidateCacheKeys(node)
            // Return the nodekey
            return new Ok({ nodeType: node.nodeType, nodeId: node.nodeId })
        },
        updateNode: async (nodeKey, state) => {
            const updateNodeResult = await graph.updateNode(nodeKey, state)
            if (!updateNodeResult.ok) return updateNodeResult
            const node = updateNodeResult.val
            invalidateCacheKeys(node)
            return updateNodeResult
        },
        deleteNode: async (nodeKey) => {
            const getNodeResult = await graph.getNode(nodeKey.nodeType, 'nodeId', nodeKey.nodeId)
            if (!getNodeResult.ok) {
                if (getNodeResult.val.errorType === 'NodeNotFound') {
                    return new Ok(null)
                }
                return getNodeResult
            }
            const node = getNodeResult.val
            const nodeResult = await graph.deleteNode(nodeKey)
            invalidateCacheKeys(node)
            if (!nodeResult.ok) return nodeResult
            return nodeResult
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
            const cacheKey = `getRelatedTo-${fromNode.nodeId}-${relationshipType}-${toNode.nodeType}`
            revalidateTag(cacheKey)
            return createRelationshipResult
        },


    }
}