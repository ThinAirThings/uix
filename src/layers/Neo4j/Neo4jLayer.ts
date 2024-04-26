
import neo4j, { Driver, Integer, Node, Relationship } from 'neo4j-driver';
import { TypeOf, ZodObject, ZodRawShape } from 'zod';
import { createUniqueIndex } from './createUniqueIndex';
import { defineNode } from '../../base/defineNode';
import { GraphLayer } from '../../types/Graph';
import { UixNode } from '../../types/UixNode';
import { UixRelationship } from '@/src/types/UixRelationship';
import { Neo4jLayerError } from './Neo4jLayerError';
import { Ok, Err } from 'ts-results';




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
    | 'getDefinition'
    | 'getNodeType'
>, config: {
    connection: {
        uri: string,
        username: string,
        password: string
    }
}): GraphLayer<N, R, E, UIdx, Neo4jLayerError> & { neo4jDriver: Driver } => {
    const neo4jDriver = neo4j.driver(config.connection.uri, neo4j.auth.basic(
        config.connection.username,
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
        neo4jDriver,
        createNode: async (
            nodeType,
            initialState
        ) => {
            await Promise.all(uniqueIndexesCreated)
            const newNode = await graph.createNode(nodeType, initialState) //as unknown as UixNode<typeof nodeType, TypeOf<(N[number] & { nodeType: typeof nodeType })['stateDefinition']>>
            if (!neo4jDriver) throw new Error('Neo4jNode.neo4jDriver is not configured')
            const session = neo4jDriver.session()
            try {
                const result = await session.executeWrite(async tx => {
                    return await tx.run<{
                        node: Node<Integer, UixNode<typeof nodeType, TypeOf<(N[number] & { nodeType: typeof nodeType })['stateDefinition']>>>
                    }>(`
                        CREATE (node:${nodeType} $newNode)
                        RETURN node
                    `, { newNode: newNode.ok ? newNode.val : {} })
                }).then(({ records }) => records.map(record => record.get('node').properties)[0])
                return new Ok(result)
            } catch (_e) {
                const e = _e as Error
                if (e.message === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
                    return new Err(new Neo4jLayerError('UniqueIndexViolation', e.message))
                }
                return new Err(new Neo4jLayerError('Unknown', e.message))
            } finally {
                await session.close()
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
                const result = await session.executeRead(async tx => {
                    return await tx.run<{
                        node: Node<Integer, UixNode<typeof nodeType, TypeOf<(N[number] & { nodeType: typeof nodeType })['stateDefinition']>>>
                    }>(`
                        MATCH (node:${nodeType} {${nodeIndex}: $indexKey})
                        RETURN node
                    `, { indexKey })
                }).then(({ records }) => records.length ? records.map(record => record.get('node').properties)[0] : null)
                if (!result) return new Err(new Neo4jLayerError('NodeNotFound', `Node of type ${nodeType} with ${nodeIndex} ${indexKey} not found`))
                return new Ok(result)
            } catch (_e) {
                const e = _e as Error
                return new Err(new Neo4jLayerError('NodeNotFound', e.message))
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
                const result = await session.executeWrite(async tx => {
                    return await tx.run<{
                        node: Node<Integer, UixNode<typeof nodeType, TypeOf<(N[number] & { nodeType: typeof nodeType })['stateDefinition']>>>
                    }>(`
                        MATCH (node:${nodeType} {nodeId: $nodeId})
                        SET node += $state
                        RETURN node
                    `, { nodeId, state })
                }).then(({ records }) => records.map(record => record.get('node').properties)[0])
                return new Ok(result)
            } catch (_e) {
                const e = _e as Error
                return new Err(new Neo4jLayerError('Unknown', e.message))
                // // Rollback
                // graph.updateNode(nodeType, nodeId, initialState)
                // optimisticUpdatedNode
            } finally {
                await session.close()
            }
        },
        deleteNode: async (
            { nodeType, nodeId }
        ) => {
            if (!neo4jDriver) throw new Error('Neo4jNode.neo4jDriver is not configured')
            const session = neo4jDriver.session()
            try {
                const result = await session.executeWrite(async tx => {
                    return await tx.run<{
                        node: Node<Integer, UixNode<typeof nodeType, TypeOf<(N[number] & { nodeType: typeof nodeType })['stateDefinition']>>>
                    }>(`
                    MATCH (node:${nodeType} {nodeId: $nodeId})
                    OPTIONAL MATCH (node)-[r]-() 
                    DELETE r, node 
                    RETURN node
                    `, { nodeId })
                }).then(({ records }) => records.length ? records.map(record => record.get('node').properties)[0] : null)
                if (!result) return new Err(new Neo4jLayerError('NodeNotFound', `Node of type ${nodeType} with nodeId: ${nodeId} not found`))
                return new Ok(result)
            } catch (_e) {
                const e = _e as Error
                return new Err(new Neo4jLayerError('Unknown', e.message))
            } finally {
                await session.close()
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
                const result = await session.executeWrite(async tx => {
                    return await tx.run<{
                        fromNode: Node<Integer, UixNode<typeof fromNode.nodeType, TypeOf<(N[number] & { nodeType: typeof fromNode.nodeType })['stateDefinition']>>>,
                        relationship: Relationship<Integer, UixRelationship<typeof relationshipType, TypeOf<NonNullable<(R[number] & { nodeType: typeof fromNode.nodeType })['stateDefinition']>>>>,
                        toNode: Node<Integer, UixNode<typeof toNode.nodeType, TypeOf<(N[number] & { nodeType: typeof toNode.nodeType })['stateDefinition']>>>
                    }>(`
                        MATCH (fromNode:${fromNode.nodeType} {nodeId: $fromNode.nodeId})
                        MATCH (toNode:${toNode.nodeType} {nodeId: $toNode.nodeId})
                        MERGE (fromNode)-[relationship:${relationshipType as string}]->(toNode)
                        SET relationship += $state
                        RETURN fromNode, toNode, relationship
                    `, { fromNode, toNode, state: state ?? {} })
                }).then(({ records }) => records.map(record => {
                    return {
                        fromNode: record.get('fromNode').properties,
                        relationship: record.get('relationship').properties,
                        toNode: record.get('toNode').properties
                    }
                })[0])
                return new Ok(result)
            } catch (_e) {
                const e = _e as Error
                return new Err(new Neo4jLayerError('Unknown', e.message))
            } finally {
                await session.close()
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
                const result = await session.executeRead(async tx => {
                    return await tx.run<{
                        toNode: Node<Integer, UixNode<typeof toNodeType, TypeOf<(N[number] & { nodeType: typeof toNodeType })['stateDefinition']>>>
                    }>(`
                        MATCH (fromNode:${nodeType} {nodeId: $fromNodeId})-[:${relationshipType as string}]->(toNode:${toNodeType})
                        RETURN toNode
                    `, { fromNodeId: nodeId })
                }).then(({ records }) => records.map(record => record.get('toNode').properties))
                return new Ok(result)
            } catch (_e) {
                const e = _e as Error
                return new Err(new Neo4jLayerError('Unknown', e.message))
            } finally {
                await session.close()
            }
        }
    }
}





