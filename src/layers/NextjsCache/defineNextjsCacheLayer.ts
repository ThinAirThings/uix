import { defineNode } from "@/src/base/defineNode";
import { unstable_cache as cache, revalidateTag } from 'next/cache'
import { TypeOf, ZodObject } from "zod";
import { GraphLayer } from "@/src/types/GraphLayer";
import { Err, Ok, Result } from "ts-results";
import { GraphNodeType } from "@/src/types/GraphNodeType";
import { ExtendUixError } from "@/src/base/UixErr";
import { NodeKey } from "@/src/types/NodeKey";



// NOTE!!! This was a failed attempt. NextJS caching fails for dynamic caching
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
): (Omit<GraphLayer<N, R, E, UIdx, PreviousLayers | 'NextjsCache'>, 'getRelatedTo'> & {
    // Override getRelatedTo to only return NodeKeys. There's likely cleaner ways to do the types for this. But for now this works.
    getRelatedTo: <
        FromNodeType extends keyof E,
        RelationshipType extends ((keyof E[FromNodeType]) & R[number]['relationshipType']),
        ToNodeType extends E[FromNodeType][RelationshipType] extends readonly any[] ? E[FromNodeType][RelationshipType][number] : never
    >(...args: Parameters<typeof graph.getRelatedTo<FromNodeType, RelationshipType, ToNodeType>>) => Promise<Result<
        (R[number] & { relationshipType: RelationshipType })['uniqueFromNode'] extends true
        ? NodeKey<ToNodeType>
        : NodeKey<ToNodeType>[],
        ReturnType<ReturnType<typeof ExtendUixError<PreviousLayers>>>
    >>
}) => {
    const cacheMap = new Map<string, ReturnType<typeof cache>>()
    const invalidationFnKeys = ['getNode', 'getRelatedTo'] as const
    const invalidateCacheKeys = (node: GraphNodeType<typeof graph, N[number]['nodeType']>) => {
        const uniqueIndexes = ['nodeId', ...graph.uniqueIndexes[node.nodeType] ?? []] as string[]
        const cacheKeys = uniqueIndexes.map(index => invalidationFnKeys.map(fnKey => `${fnKey}-${node.nodeType}-${index}-${node[index]}`)).flat()
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
            if (!cacheMap.has(cacheKey)) {
                cacheMap.set(cacheKey, cache(async (...args: Parameters<typeof graph.getRelatedTo>) => {
                    return await graph.getRelatedTo(...args)
                }, [cacheKey], {
                    tags: [cacheKey]
                }))
            }
            // Get the related nodes
            return await cacheMap.get(cacheKey)!(fromNode, relationshipType, toNodeType)
        },
        // Note the NextJs cache layer needs to use modified return types. You need to redefine the Neo4j layer to return nodes and then change the
        // return type here to be NodeKeys.
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
                if (getNodeResult.val.subtype === 'NodeNotFound') {
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
            if (fromNode instanceof Err) return fromNode
            if (fromNode instanceof Ok) fromNode = fromNode.val
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