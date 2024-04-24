
import { OmitNodeContants, defineGraph } from '@/src/base/defineGraph';
import neo4j from 'neo4j-driver';
import { TypeOf, UnknownKeysParam, ZodObject, ZodTypeAny } from 'zod';
import { createUniqueIndex } from './createUniqueIndex';
import { defineNode } from '@/src/base/defineNode';
import { NodeKey } from '@/src/types/NodeKey';
import { create } from 'domain';
import { UixNode } from '@/src/types/UixNode';



export const configureNeo4jLayer2 = (config: {
    uri: string,
    user: string,
    password: string
}) => {
    const neo4jDriver = neo4j.driver(config.uri, neo4j.auth.basic(
        config.user,
        config.password
    ))
    return <
        G extends ReturnType<typeof defineGraph<any>>,
        UIdx extends {
            [T in G['nodeDefinitions'][number]['nodeType']]?: readonly (keyof TypeOf<(G['nodeDefinitions'][number] & { nodeType: T })['stateDefinition']>)[]
        }
    >(graph: G, config: {
        uniqueIndexes: UIdx
    }) => {
        const nodeDefinitions = graph.nodeDefinitions as ReturnType<typeof defineNode>[]
        // Create Unique Indexes
        const uniqueIndexesCreated = [
            ...nodeDefinitions.map(async ({ nodeType }) => createUniqueIndex(neo4jDriver, nodeType, 'nodeId')),
            ...(config.uniqueIndexes && Object.entries(config.uniqueIndexes).map(([nodeType, index]) => {
                return createUniqueIndex(neo4jDriver, nodeType, index as string)
            })) ?? []
        ]
        return {
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
            >(
                fromNode: NodeKey<FNT>,
                relationshipType: (G['nodeDefinitions'][number] & { nodeType: FNT })['relationships'][number],
                toNode: NodeKey<G['nodeDefinitions'][number]['nodeType']>
            ) => {
                if (!neo4jDriver) throw new Error('Neo4jNode.neo4jDriver is not configured')
                const session = neo4jDriver.session()
                try {
                    const result = await session.run(`
                        MATCH (from:${fromNode.nodeType} {nodeId: $fromNode.nodeId})
                        MATCH (to:${toNode.nodeType} {nodeId: $toNode.nodeId})
                        CREATE (from)-[:${relationshipType}]->(to)
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
                T extends G['nodeDefinitions'][number]['nodeType'],
            >() => {

            }
        }
    }
}



