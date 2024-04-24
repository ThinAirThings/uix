
import { defineGraph } from '@/src/base/defineGraph';
import neo4j, { Integer, Node } from 'neo4j-driver';
import { TypeOf, ZodObject, ZodRawShape } from 'zod';
import { createUniqueIndex } from './createUniqueIndex';
import { defineNode } from '@/src/base/defineNode';
import { NodeKey } from '@/src/types/NodeKey';
import { UixNode } from '@/src/types/UixNode';


export const Neo4jLayer = <
    N extends readonly ReturnType<typeof defineNode< any, any>>[],
    G extends ReturnType<typeof defineGraph<N, any>>,
    UIdx extends {
        [T in G['nodeDefinitions'][number]['nodeType']]?: readonly (keyof TypeOf<(G['nodeDefinitions'][number] & { nodeType: T })['stateDefinition']>)[]
    }
>(graph: G, config: {
    connection: {
        uri: string,
        user: string,
        password: string
    }
    uniqueIndexes: UIdx
}) => {
    const neo4jDriver = neo4j.driver(config.connection.uri, neo4j.auth.basic(
        config.connection.user,
        config.connection.password
    ))
    const nodeDefinitions = graph.nodeDefinitions
    // Create Unique Indexes
    const uniqueIndexesCreated = [
        ...nodeDefinitions.map(async ({ nodeType }) => createUniqueIndex(neo4jDriver, nodeType, 'nodeId')),
        ...(config.uniqueIndexes && Object.entries(config.uniqueIndexes).map(([nodeType, index]) => {
            return createUniqueIndex(neo4jDriver, nodeType, index as string)
        })) ?? []
    ]
    return {
        uniqueIndexes: config.uniqueIndexes as UIdx,
        nodeDefinitions: graph.nodeDefinitions,
        relationshipDefinitions: graph.relationshipDefinitions,
        createNode: async <
            T extends G['nodeDefinitions'][number]['nodeType']
        >(
            nodeType: T,
            initialState: TypeOf<(G['nodeDefinitions'][number] & { nodeType: T })['stateDefinition']>
        ) => {
            await Promise.all(uniqueIndexesCreated)
            const newNode = graph.createNode(nodeType, initialState)
            if (!neo4jDriver) throw new Error('Neo4jNode.neo4jDriver is not configured')
            const session = neo4jDriver.session()
            try {
                const result = await session.run(`
                    CREATE (n:${nodeType} $newNode)
                    RETURN n
                `, { newNode })
                return newNode
            } finally {
                session.close()
            }
        },
        getNode: async <
            T extends G['nodeDefinitions'][number]['nodeType'],
        >(
            nodeType: T,
            nodeIndex: T extends keyof UIdx
                ? UIdx[T] extends string[]
                ? UIdx[T][number] | 'nodeId'
                : 'nodeId'
                : 'nodeId',
            indexKey: string
        ) => {
            if (!neo4jDriver) throw new Error('Neo4jNode.neo4jDriver is not configured')
            const session = neo4jDriver.session()
            try {
                const result = await session.run(`
                    MATCH (n:${nodeType} {${nodeIndex}: $indexKey})
                    RETURN n
                `, { indexKey })
                return result.records[0].get('n').properties as UixNode<T, TypeOf<(G['nodeDefinitions'][number] & { nodeType: T })['stateDefinition']>>
            } finally {
                session.close()
            }
        },
        updateNode: async <
            T extends G['nodeDefinitions'][number]['nodeType']
        >(
            { nodeType, nodeId }: NodeKey<T>,
            state: Partial<TypeOf<(G['nodeDefinitions'][number] & { nodeType: T })['stateDefinition']>>
        ) => {
            //// You can implement optimistic updates here
            // const initialState = graph.getNode(nodeType, nodeId)
            // const optimisticUpdatedNode = graph.updateNode(nodeType, nodeId, state)
            if (!neo4jDriver) throw new Error('Neo4jNode.neo4jDriver is not configured')
            const session = neo4jDriver.session()
            try {
                const result = await session.run(`
                    MATCH (n:${nodeType} {nodeId: $nodeId})
                    SET n += $state
                    RETURN n
                `, { nodeId, state })
                return result.records[0].get('n').properties
            } catch (e) {
                console.error(e)
                // // Rollback
                // graph.updateNode(nodeType, nodeId, initialState)
                // optimisticUpdatedNode
            } finally {
                session.close()
            }
        },
        createRelationship: async <
            FNT extends G['nodeDefinitions'][number]['nodeType'],
            RT extends keyof (G['relationshipDefinitions'][FNT]),
        >(
            fromNode: NodeKey<FNT>,
            relationshipType: RT,
            toNode: NodeKey<G['relationshipDefinitions'][FNT][RT]['toNodeType'][number]>,
            ...[state]: (G['relationshipDefinitions'][FNT][RT])['stateDefinition'] extends ZodObject<ZodRawShape>
                ? [TypeOf<(G['relationshipDefinitions'][FNT][RT])['stateDefinition']>]
                : []
        ) => {
            if (!neo4jDriver) throw new Error('Neo4jNode.neo4jDriver is not configured')
            const session = neo4jDriver.session()
            try {
                const result = await session.run(`
                    MATCH (from:${fromNode.nodeType} {nodeId: $fromNode.nodeId})
                    MATCH (to:${toNode.nodeType} {nodeId: $toNode.nodeId})
                    MERGE (from)-[:${relationshipType as string}]->(to)
                    RETURN from, to
                `, { fromNode, toNode })
                return {
                    fromNode: result.records[0].get('from').properties,
                    toNode: result.records[0].get('to').properties
                }
            } finally {
                session.close()
            }
        },
        getRelatedTo: async <
            FNT extends G['nodeDefinitions'][number]['nodeType'],
            RT extends keyof (G['relationshipDefinitions'][FNT]),
            TNT extends G['relationshipDefinitions'][FNT][RT]['toNodeType'][number]
        >(
            fromNode: NodeKey<FNT>,
            relationshipType: RT,
            toNodeType: TNT
        ) => {
            if (!neo4jDriver) throw new Error('Neo4jNode.neo4jDriver is not configured')
            const session = neo4jDriver.session()
            try {
                const { nodeType, nodeId } = fromNode
                return await session.executeRead(async tx => {
                    return await tx.run<{
                        toNode: Node<Integer, UixNode<TNT, TypeOf<(G['nodeDefinitions'][number] & { nodeType: TNT })['stateDefinition']>>>
                    }>(`
                        MATCH (fromNode:${nodeType} {nodeId: $fromNodeId})-[:${relationshipType as string}]->(toNode:${toNodeType})
                        RETURN toNode
                    `, { fromNodeId: nodeId })
                }).then(({ records }) => records.map(record => record.get('toNode').properties))
            } finally {
                session.close()
            }
        }
    }
}




