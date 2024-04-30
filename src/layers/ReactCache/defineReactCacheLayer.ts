import { defineNode } from "@/src/base/defineNode";
import { TypeOf, ZodObject } from "zod";
import { GraphLayer } from "@/src/types/GraphLayer";
import { GraphNodeType } from "@/src/types/GraphNodeType";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { Ok } from "@/src/types/Result";
import { useCallback } from 'react'



export const defineReactCacheLayer = <
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
): GraphLayer<N, R, E, UIdx, PreviousLayers | 'ReactCache'> & {
    useNode: <
        T extends N[number]['nodeType'],
        R = (Awaited<ReturnType<typeof graph.getNode<T>>> & { ok: true })['val']
    >(
        nodeType: Parameters<typeof graph.getNode<T>>[0],
        nodeIndex: Parameters<typeof graph.getNode<T>>[1],
        indexKey: Parameters<typeof graph.getNode<T>>[2],
        selector?: ((node: (Awaited<ReturnType<typeof graph.getNode<T>>> & { ok: true })['val']) => R)
    ) => ReturnType<
        typeof useQuery<
            (Awaited<ReturnType<typeof graph.getNode<T>>> & { ok: true })['val'],
            Error,
            R
        >
    >
    useRelatedTo: <
        FromNodeType extends keyof E,
        RelationshipType extends ((keyof E[FromNodeType]) & R[number]['relationshipType']),
        ToNodeType extends E[FromNodeType][RelationshipType] extends readonly any[] ? E[FromNodeType][RelationshipType][number] : never
    >(
        ...args: Parameters<typeof graph.getRelatedTo<FromNodeType, RelationshipType, ToNodeType>>
    ) => ReturnType<typeof useQuery<
        (Awaited<ReturnType<typeof graph.getRelatedTo<FromNodeType, RelationshipType, ToNodeType>>> & { ok: true })['val']
    >>
} => {
    const queryClient = new QueryClient()
    const invalidateCacheKeys = (node: GraphNodeType<typeof graph, N[number]['nodeType']>) => {
        const uniqueIndexes = ['nodeId', ...graph.uniqueIndexes[node.nodeType] ?? []] as string[]
        const cacheKeys = uniqueIndexes.map(index => [node.nodeType, index, node[index]])
        cacheKeys.forEach(cacheKey => queryClient.invalidateQueries({
            queryKey: cacheKey
        }))
    }
    return {
        ...graph,
        useNode: (nodeType, nodeIndex, indexKey, selector) => {
            return useQuery({
                queryKey: [nodeType, nodeIndex, indexKey],
                queryFn: async () => {
                    const getNodeResult = await graph.getNode(nodeType, nodeIndex, indexKey)
                    if (!getNodeResult.ok) throw new Error(getNodeResult.val.message)
                    return getNodeResult.val
                },
                select: selector ? useCallback(selector, []) : undefined
            }, queryClient)
        },
        useRelatedTo: (fromNode, relationshipType, toNodeType) => useQuery({
            queryKey: [fromNode.nodeId, relationshipType, toNodeType],
            queryFn: async () => {
                const getRelatedToResult = await graph.getRelatedTo(fromNode, relationshipType, toNodeType)
                if (!getRelatedToResult.ok) throw new Error(getRelatedToResult.val.message)
                return getRelatedToResult.val
            }
        }, queryClient),
        // You need this to force the user to use getNode after creation. If you don't, then they could be stuck with a null value after creation.
        createNode: async (nodeType, initialState) => {
            const createNodeResult = await graph.createNode(nodeType, initialState)
            if (!createNodeResult.ok) return createNodeResult
            const node = createNodeResult.val
            // Invalidate all caches for the node, remember react will have run through the tree and tried all of the getNodes which returned null.
            invalidateCacheKeys(node)
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
            if (!getNodeResult.ok) return deleteNodeResult
            const node = getNodeResult.val
            if (!node) return deleteNodeResult
            invalidateCacheKeys(node)
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
            // revalidateTag(cacheKey)
            return createRelationshipResult
        },
    }
}