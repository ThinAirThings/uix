import { defineNode } from "@/src/base/defineNode";
import { unstable_cache as cache, revalidateTag } from 'next/cache'
import { TypeOf, ZodObject } from "zod";
import { GraphLayer } from "@/src/types/GraphLayer";
import { GraphNodeType } from "@/src/types/GraphNodeType";
import { Ok } from "@/src/types/Result";


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
    console.log("Inside nextjs layer construction")
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
    async function getCachedOrFetch<T>(cacheKey: string, fetchFunction: () => Promise<T>, additionalKeys?: string[]): Promise<T> {
        if (!cacheMap.has(cacheKey)) {
            cacheMap.set(cacheKey, cache(fetchFunction, [cacheKey], { tags: [cacheKey, ...additionalKeys ? additionalKeys : []] }));
        }
        return cacheMap.get(cacheKey)!();
    }
    // Define the graph layer
    const thisGraphLayer: GraphLayer<N, R, E, UIdx, PreviousLayers | 'NextjsCache'> = {
        ...graph,
        // Get node has an explicit cache key
        getNode: async (nodeType, nodeIndex, indexKey) => {
            console.log("Running get node!")
            const cacheKey = `getNode-${nodeType}-${nodeIndex}-${indexKey}`
            const node = await getCachedOrFetch(cacheKey, async () => {
                return await graph.getNode(nodeType, nodeIndex, indexKey)
            })
            return node
        },
        getNodeType: async (nodeType) => {
            const cacheKey = `getNodeType-${nodeType}`
            const nodeTypesResult = await getCachedOrFetch(cacheKey, async () => {
                return await graph.getNodeType(nodeType)
            })
            if (!nodeTypesResult.ok) return nodeTypesResult
            // Get the nodes from the getNode call to check for cache invalidations from node updates
            const nodeTypes = nodeTypesResult.val
            const nodesResult = ((await Promise.all(nodeTypes.map(async ({ nodeType, nodeId }) => {
                return await thisGraphLayer.getNode(nodeType, 'nodeId', nodeId)
            }))
                .then(nodeResults => nodeResults.filter(nodeResult => nodeResult.ok))) as (Awaited<ReturnType<typeof graph.getNode>> & { ok: true })[])
                .map(nodeResult => nodeResult.val)
            return Ok(nodesResult)
        },
        getRelatedTo: async (fromNode, relationshipType, toNodeType) => {
            // Set explicit cache key
            const cacheKey = `getRelatedTo-${fromNode.nodeId}-${relationshipType}-${toNodeType}`
            const relatedNodeKeysResult = await getCachedOrFetch(cacheKey, async () => {
                return await graph.getRelatedTo(fromNode, relationshipType, toNodeType)
            }, [`getRelatedTo-${toNodeType}`])
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