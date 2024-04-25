
import neo4j, { Integer, Node } from 'neo4j-driver';
import { TypeOf, ZodObject, ZodRawShape } from 'zod';
import { createUniqueIndex } from './createUniqueIndex';
import { defineNode } from '../../base/defineNode';
import { GraphLayer } from '../../types/Graph';
import { UixNode } from '../../types/UixNode';


export const Neo4jLayer = <
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
    }
>(graph: Pick<
    GraphLayer<N, R, E, UIdx>,
    | 'relationshipDefinitions'
    | 'edgeDefinitions'
    | 'nodeDefinitions'
    | 'uniqueIndexes'
    | 'createNode'
>, config: {
    connection: {
        uri: string,
        user: string,
        password: string
    }
}): GraphLayer<N, R, E, UIdx> => {
    const neo4jDriver = neo4j.driver(config.connection.uri, neo4j.auth.basic(
        config.connection.user,
        config.connection.password
    ))
    // Create Unique Indexes
    const uniqueIndexesCreated = [
        ...graph.nodeDefinitions.map(async ({ nodeType }) => createUniqueIndex(neo4jDriver, nodeType, 'nodeId')),
        ...(graph.uniqueIndexes && Object.entries(graph.uniqueIndexes).map(([nodeType, index]) => {
            return createUniqueIndex(neo4jDriver, nodeType, index as string)
        })) ?? []
    ]
    return {
        ...graph,
        createNode: async (
            nodeType,
            initialState
        ) => {
            await Promise.all(uniqueIndexesCreated)
            const newNode = graph.createNode(nodeType, initialState) //as unknown as UixNode<typeof nodeType, TypeOf<(N[number] & { nodeType: typeof nodeType })['stateDefinition']>>
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
        getNode: async (
            nodeType,
            nodeIndex,
            indexKey
        ) => {
            if (!neo4jDriver) throw new Error('Neo4jNode.neo4jDriver is not configured')
            const session = neo4jDriver.session()
            try {
                return await session.executeRead(async tx => {
                    return await tx.run<{
                        node: Node<Integer, UixNode<typeof nodeType, TypeOf<(N[number] & { nodeType: typeof nodeType })['stateDefinition']>>>
                    }>(`
                        MATCH (node:${nodeType} {${nodeIndex}: $indexKey})
                        RETURN node
                    `, { indexKey })
                }).then(({ records }) => records.map(record => record.get('node').properties)[0])
            } finally {
                session.close()
            }
        },
        updateNode: async (
            { nodeType, nodeId },
            state
        ) => {
            //// You can implement optimistic updates here
            // const initialState = graph.getNode(nodeType, nodeId)
            // const optimisticUpdatedNode = graph.updateNode(nodeType, nodeId, state)
            if (!neo4jDriver) throw new Error('Neo4jNode.neo4jDriver is not configured')
            const session = neo4jDriver.session()
            try {
                return await session.executeWrite(async tx => {
                    return await tx.run<{
                        node: Node<Integer, UixNode<typeof nodeType, TypeOf<(N[number] & { nodeType: typeof nodeType })['stateDefinition']>>>
                    }>(`
                        MATCH (node:${nodeType} {nodeId: $nodeId})
                        SET node += $state
                        RETURN node
                    `, { nodeId, state })
                }).then(({ records }) => records.map(record => record.get('node').properties)[0])
            } catch (e) {
                console.error(e)
                throw e
                // // Rollback
                // graph.updateNode(nodeType, nodeId, initialState)
                // optimisticUpdatedNode
            } finally {
                session.close()
            }
        },
        createRelationship: async (
            fromNode,
            relationshipType,
            toNode,
            ...[state]
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
        getRelatedTo: async (
            fromNode,
            relationshipType,
            toNodeType
        ) => {
            if (!neo4jDriver) throw new Error('Neo4jNode.neo4jDriver is not configured')
            const session = neo4jDriver.session()
            try {
                const { nodeType, nodeId } = fromNode
                return await session.executeRead(async tx => {
                    return await tx.run<{
                        toNode: Node<Integer, UixNode<typeof toNodeType, TypeOf<(N[number] & { nodeType: typeof toNodeType })['stateDefinition']>>>
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




