import { defineNode } from "@/src/base/defineNode";
import { unstable_cache as cache, revalidateTag } from 'next/cache'
import { TypeOf, ZodObject, ZodRawShape } from "zod";
import { GraphLayer } from "@/src/types/GraphLayer";
import { GraphNodeType } from "@/src/types/GraphNodeType";
import { ExtendUixError } from "@/src/base/UixErr";
import { NodeKey } from "@/src/types/NodeKey";
import { Ok, Result } from "@/src/types/Result";
import { UixRelationship } from "@/src/types/UixRelationship";


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
): (Omit<
    GraphLayer<N, R, E, UIdx, PreviousLayers | 'NextjsCache'>,
    'getRelatedTo' | 'createNode' | 'createRelationship'
> & {
    // Modify signatures to return nodekeys to force cache invalidation.
    createNode: <
        T extends N[number]['nodeType']
    >(
        nodeType: T,
        initialState: TypeOf<(N[number] & { nodeType: T })['stateDefinition']>
    ) => Promise<Result<
        NodeKey<T>,
        ReturnType<ReturnType<typeof ExtendUixError<PreviousLayers | 'NextjsCache'>>>
    >>
    createRelationship: <
        FromNodeType extends (keyof E & Capitalize<string>),
        RelationshipType extends ((keyof E[FromNodeType]) & Uppercase<string>),
        ToNodeType extends E[FromNodeType][RelationshipType] extends readonly any[] ? E[FromNodeType][RelationshipType][number] : never
    >(
        fromNode: Result<NodeKey<FromNodeType>, ReturnType<ReturnType<typeof ExtendUixError<PreviousLayers | 'NextjsCache'>>>> | NodeKey<FromNodeType>,
        relationshipType: RelationshipType,
        toNode: {
            nodeType: ToNodeType,
            initialState: TypeOf<(N[number] & { nodeType: ToNodeType })['stateDefinition']>
        } | NodeKey<ToNodeType>,
        ...[state]: NonNullable<(R[number] & { relationshipType: RelationshipType })['stateDefinition']> extends ZodObject<ZodRawShape>
            ? [TypeOf<NonNullable<(R[number] & { relationshipType: RelationshipType })['stateDefinition']>>]
            : []
    ) => Promise<Result<{
        fromNodeKey: NodeKey<FromNodeType>,
        relationship: UixRelationship<RelationshipType, TypeOf<NonNullable<(R[number] & { relationshipType: RelationshipType })['stateDefinition']>>>,
        toNodeKey: NodeKey<ToNodeType>
    }, ReturnType<ReturnType<typeof ExtendUixError<PreviousLayers | 'NextjsCache'>>>>>

    getRelatedTo: <
        FromNodeType extends keyof E,
        RelationshipType extends ((keyof E[FromNodeType]) & R[number]['relationshipType']),
        ToNodeType extends E[FromNodeType][RelationshipType] extends readonly any[] ? E[FromNodeType][RelationshipType][number] : never
    >(...args: Parameters<typeof graph.getRelatedTo<FromNodeType, RelationshipType, ToNodeType>>) => Promise<Result<
        (R[number] & { relationshipType: RelationshipType })['uniqueFromNode'] extends true
        ? NodeKey<ToNodeType>
        : NodeKey<ToNodeType>[],
        ReturnType<ReturnType<typeof ExtendUixError<PreviousLayers | 'NextjsCache'>>>
    >>
    getNodeType: <
        NodeType extends N[number]['nodeType']
    >(nodeType: NodeType) => Promise<Result<
        NodeKey<NodeType>[],
        ReturnType<ReturnType<typeof ExtendUixError<PreviousLayers | 'NextjsCache'>>>
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
            const node = createNodeResult.val
            // Invalidate all caches for the node, remember react will have run through the tree and tried all of the getNodes which returned null.
            invalidateCacheKeys(node)
            // Return the nodekey
            return Ok({ nodeType: node.nodeType, nodeId: node.nodeId })
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
            return Ok({
                fromNodeKey: { nodeType: fromNode.nodeType, nodeId: fromNode.nodeId },
                relationship: createRelationshipResult.val.relationship,
                toNodeKey: { nodeType: toNode.nodeType, nodeId: createRelationshipResult.val.toNode.nodeId }
            })
        },
    }
}