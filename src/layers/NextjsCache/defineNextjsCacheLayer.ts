import { defineNode } from "@/src/base/defineNode";
import { unstable_cache as cache, revalidateTag } from 'next/cache'
import { TypeOf, ZodObject, ZodRawShape } from "zod";
import { GraphLayer } from "@/src/types/GraphLayer";
import { GraphNodeType } from "@/src/types/GraphNodeType";
import { ExtendUixError } from "@/src/base/UixErr";
import { NodeKey } from "@/src/types/NodeKey";
import { Ok, Result } from "@/src/types/Result";
import { UixRelationship } from "@/src/types/UixRelationship";
import { createRelationshipDictionary } from "@/src/utiltities/createRelationshipDictionary";
import { UixNode } from "@/src/types/UixNode";


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
    PreviousLayers extends Capitalize<string>
>(
    graph: GraphLayer<N, R, E, UIdx, PreviousLayers>,
): GraphLayer<N, R, E, UIdx, PreviousLayers | 'NextjsCache'> => {
    // Create data structures
    const cacheMap = new Map<string, ReturnType<typeof cache>>()
    const invalidationFnKeys = ['getNode', 'getRelatedTo'] as const
    const invalidateCacheKeys = (node: GraphNodeType<typeof graph, N[number]['nodeType']>) => {
        const uniqueIndexes = ['nodeId', ...graph.uniqueIndexes[node.nodeType] ?? []] as string[]
        const cacheKeys = uniqueIndexes.map(index => invalidationFnKeys.map(fnKey => `${fnKey}-${node.nodeType}-${index}-${node[index]}`)).flat()
        cacheKeys.forEach(cacheKey => {
            revalidateTag(cacheKey)
        })
    }

    // Define the graph layer
    const thisGraphLayer: GraphLayer<N, R, E, UIdx, PreviousLayers | 'NextjsCache'> = {
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
        getNodeType: async (nodeType) => {
            const cacheKey = `getNodeType-${nodeType}`
            if (!cacheMap.has(cacheKey)) {
                cacheMap.set(cacheKey, cache(async (...args: Parameters<typeof graph.getNodeType>) => {
                    return await graph.getNodeType(...args)
                }, [cacheKey], {
                    tags: [cacheKey]
                }))
            }
            return await cacheMap.get(cacheKey)!(nodeType)
        },
        getRelatedTo: async (fromNode, relationshipType, toNodeType) => {
            // Set explicit cache key
            const cacheKey = `getRelatedTo-${fromNode.nodeId}-${relationshipType}-${toNodeType}`
            if (!cacheMap.has(cacheKey)) {
                cacheMap.set(cacheKey, cache(async (...args: Parameters<typeof graph.getRelatedTo>) => {
                    return await graph.getRelatedTo(...args)
                }, [cacheKey], {
                    tags: [cacheKey, `getRelatedTo-${toNodeType}`]
                }))
            }
            // Get the related nodes
            const relatedNodeKeysResult = await cacheMap.get(cacheKey)!(fromNode, relationshipType, toNodeType) as Awaited<ReturnType<typeof graph.getRelatedTo>>
            // Get the nodes from the getNode call to check for cache invalidations from node updates
            if (!relatedNodeKeysResult.ok) return relatedNodeKeysResult
            const relatedNodeKeys = relatedNodeKeysResult.val
            const relatedNodesOrNodeResult = (relatedNodeKeys instanceof Array
                ? Ok(await Promise.all(
                    relatedNodeKeys.map(async nodeKey => {
                        const getNodeResult = await thisGraphLayer.getNode(nodeKey.nodeType, 'nodeId', nodeKey.nodeId)
                        if (!getNodeResult.ok) return null
                        return getNodeResult.val
                    }).filter(node => node !== null)) as GraphNodeType<typeof graph, N[number]['nodeType']>[])
                : await thisGraphLayer.getNode(relatedNodeKeys.nodeType, 'nodeId', relatedNodeKeys.nodeId)) as Awaited<ReturnType<typeof graph.getRelatedTo>>
            if (!relatedNodesOrNodeResult.ok) return relatedNodesOrNodeResult
            return Ok(relatedNodesOrNodeResult.val)
        },
        // Note the NextJs cache layer needs to use modified return types. You need to redefine the Neo4j layer to return nodes and then change the
        // return type here to be NodeKeys.
        // You need this to force the user to use getNode after creation. If you don't, then they could be stuck with a null value after creation.
        createNode: async (nodeType, initialState) => {
            const createNodeResult = await graph.createNode(nodeType, initialState)
            if (!createNodeResult.ok) {
                return createNodeResult
            }
            const node = createNodeResult.val
            // Invalidate all caches for the node, remember react will have run through the tree and tried all of the getNodes which returned null.
            invalidateCacheKeys(node)
            revalidateTag(`getNodeType-${node.nodeType}`)
            // Return the nodekey
            return Ok(node)
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
            const deleteNodeResult = await graph.deleteNode(nodeKey)
            if (!deleteNodeResult.ok) return deleteNodeResult
            if (!getNodeResult.ok) return getNodeResult
            const node = getNodeResult.val
            invalidateCacheKeys(node)
            revalidateTag(`getRelatedTo-${node.nodeType}`)
            revalidateTag(`getNodeType-${node.nodeType}`)
            return deleteNodeResult
        },
        createRelationship: async (fromNode, relationshipType, toNode, ...args) => {
            // Handle passing Result type in as toNode for common pattern
            if ('ok' in fromNode && !fromNode.ok) return fromNode
            if ('ok' in fromNode && fromNode.ok) fromNode = fromNode.val
            const createRelationshipResult = await graph.createRelationship(fromNode, relationshipType, toNode, ...args)
            if (!createRelationshipResult.ok) {
                return createRelationshipResult
            }
            // Invalidate all caches for the fromNode and toNode
            const cacheKey = `getRelatedTo-${fromNode.nodeId}-${relationshipType}-${toNode.nodeType}`
            revalidateTag(cacheKey)
            return Ok(createRelationshipResult.val)
        },
    }
    return thisGraphLayer
}