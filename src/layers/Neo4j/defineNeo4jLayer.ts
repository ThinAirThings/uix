
import neo4j, { Driver, EagerResult, Integer, Neo4jError, Node, Relationship } from 'neo4j-driver';
import { TypeOf, ZodObject, ZodRawShape } from 'zod';
import { createUniqueIndex } from './createUniqueIndex';
import { NodeDefinition, defineNode } from '../../base/defineNode';
import { GraphLayer } from '../../types/GraphLayer';
import { UixNode } from '../../types/UixNode';
import { UixRelationship } from '@/src/types/UixRelationship';
import { ExtendUixError } from '@/src/base/UixErr';
import { Ok, Err } from '@/src/types/Result';
import { createRelationshipDictionary } from '@/src/utiltities/createRelationshipDictionary';
import { LayerDefinition } from '@/src/types/LayerDefinition';
import { testGraph } from '@/tests/testGraph';
import { defineBaseGraph } from '@/src/base/defineBaseGraph';


type Entries<T> = {
    [K in keyof T]: [K, T[K]];
}[keyof T][];

export const defineNeo4jLayer = <
    G extends GraphLayer,
// T extends G extends GraphLayer<infer N, infer R, infer E, infer UIdx>
// ? readonly [N, R, E, UIdx]
// : never,
>(graph: G, config: {
    connection: {
        uri: string
        username: string
        password: string
    }
}): G => {
    type TypeArgs = G extends GraphLayer<infer N, infer R, infer E, infer UIdx>
        ? {
            nodeDefinitions: N,
            relationshipDefinitions: R,
            edgeDefinitions: E,
            uniqueIndexes: UIdx
        }
        : never
    const UixErr = ExtendUixError()
    const neo4jDriver = neo4j.driver(config.connection.uri, neo4j.auth.basic(
        config.connection.username,
        config.connection.password
    ))
    const uniqueIndexes = graph.uniqueIndexes
    // Create Unique Indexes
    const uniqueIndexesCreated = [
        ...graph.nodeDefinitions.map(async ({ nodeType }) => createUniqueIndex(neo4jDriver, nodeType, 'nodeId')),
        ...(uniqueIndexes && (Object.entries(uniqueIndexes) as Entries<typeof uniqueIndexes>).map(async ([nodeType, _indexes]) => {
            const indexes = _indexes as string[]
            return await Promise.all(indexes.map(async (index) => await createUniqueIndex(neo4jDriver, nodeType as string, index as string)))
        })) ?? []
    ]
    // Create relationship dictionary
    const relationshipDictionary = createRelationshipDictionary(graph.relationshipDefinitions)
    const thisGraphLayer: G = {
        ...graph,
        // neo4jDriver,
        createNode: async (
            nodeType,
            initialState
        ) => {
            await Promise.all(uniqueIndexesCreated)
            const newNode = await graph.createNode(nodeType, initialState) //as unknown as UixNode<typeof nodeType, TypeOf<(N[number] & { nodeType: typeof nodeType })['stateDefinition']>>
            if (!neo4jDriver) throw new Error('Neo4jNode.neo4jDriver is not configured')
            return await neo4jDriver.executeQuery<EagerResult<{
                node: Node<Integer, UixNode<typeof nodeType, TypeOf<(TypeArgs['nodeDefinitions'][number] & { nodeType: typeof nodeType })['stateDefinition']>>>
            }>>(`
                CREATE (node:${nodeType} $newNode)
                RETURN node
            `, { newNode: newNode.ok ? newNode.val : {} })
                .then(({ records }) => Ok(records.map(record => record.get('node').properties)[0]))
                .catch((e: Neo4jError) => e.message === 'Neo.ClientError.Schema.ConstraintValidationFailed'
                    ? Err(UixErr('Normal', 'UniqueIndexViolation', { message: e.message }))
                    : Err(UixErr('Fatal', 'LayerImplementationError', { message: e.message }))
                )
        },
        getNode: async (
            nodeType,
            nodeIndex,
            indexKey
        ) => {
            if (!neo4jDriver) throw new Error('Neo4jNode.neo4jDriver is not configured')
            return await neo4jDriver.executeQuery<EagerResult<{
                node: Node<Integer, UixNode<typeof nodeType, TypeOf<(TypeArgs['nodeDefinitions'][number] & { nodeType: typeof nodeType })['stateDefinition']>>>
            }>>(`
                MATCH (node:${nodeType} {${nodeIndex}: $indexKey})
                RETURN node
            `, { indexKey })
                .then(({ records }) => records.length ? records.map(record => record.get('node').properties)[0] : null)
                .then(node => node
                    ? Ok(node)
                    : Err(UixErr('Normal', 'NodeNotFound', { message: `Node of type ${nodeType} with ${nodeIndex} ${indexKey} not found` }))
                )
                .catch((e: Neo4jError) => Err(UixErr('Fatal', 'LayerImplementationError', { message: e.message })))
        },
        getNodeType: async (nodeType) => {
            if (!neo4jDriver) throw new Error('Neo4jNode.neo4jDriver is not configured')
            return await neo4jDriver.executeQuery<EagerResult<{
                node: Node<Integer, UixNode<typeof nodeType, TypeOf<(TypeArgs['nodeDefinitions'][number] & { nodeType: typeof nodeType })['stateDefinition']>>>
            }>>(`
                MATCH (node:${nodeType})
                RETURN node
            `)
                .then(({ records }) => records.map(record => record.get('node').properties))
                .then(nodes => nodes.length ? Ok(nodes) : Err(UixErr('Normal', 'NodeNotFound', { message: `Node of type ${nodeType} not found` })))
                .catch((e: Neo4jError) => Err(UixErr('Fatal', 'LayerImplementationError', { message: e.message })))
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
            // Filter out any properties that are not in the state definition
            const stateKeys = Object.keys(state)
            const stateDefinitionKeys = Object.keys(graph.getNodeDefinition(nodeType).stateDefinition.shape)
            const stateKeysNotInDefinition = stateKeys.filter(key => !stateDefinitionKeys.includes(key))
            stateKeysNotInDefinition.forEach(key => delete state[key])
            try {
                const result = await session.executeWrite(async tx => {
                    return await tx.run<{
                        node: Node<Integer, UixNode<typeof nodeType, TypeOf<(TypeArgs['nodeDefinitions'][number] & { nodeType: typeof nodeType })['stateDefinition']>>>
                    }>(`
                        MATCH (node:${nodeType} {nodeId: $nodeId})
                        SET node += $state
                        RETURN node
                    `, { nodeId, state })
                }).then(({ records }) => records.map(record => record.get('node').properties)[0])
                return Ok(result)
            } catch (_e) {
                const e = _e as Error
                return Err(UixErr('Fatal', 'LayerImplementationError', { message: e.message }))
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
                        node: Node<Integer, UixNode<typeof nodeType, TypeOf<(TypeArgs['nodeDefinitions'][number] & { nodeType: typeof nodeType })['stateDefinition']>>>
                    }>(`
                    MATCH (node:${nodeType} {nodeId: $nodeId})
                    OPTIONAL MATCH (node)-[r]-() 
                    DELETE r, node 
                    RETURN node
                    `, { nodeId })
                }).then(({ records }) => records.length ? records.map(record => record.get('node').properties)[0] : null)
                return Ok(null)
            } catch (_e) {
                const e = _e as Error
                return Err(UixErr('Fatal', 'LayerImplementationError', { message: e.message }))
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
            // Handle passing Result type in as fromNode or toNode for common pattern
            if ('ok' in fromNode && !fromNode.ok) return fromNode
            if ('ok' in fromNode && fromNode.ok) fromNode = fromNode.val

            // Check for driver
            if (!neo4jDriver) throw new Error('Neo4jNode.neo4jDriver is not configured')
            const session = neo4jDriver.session()
            try {
                // Check for unique relationship defniiton
                if (relationshipDictionary[relationshipType].uniqueFromNode) {
                    const result = await session.executeRead(async tx => {
                        return await tx.run<{
                            relationship: Relationship<Integer, UixRelationship<typeof relationshipType, TypeOf<NonNullable<(TypeArgs['relationshipDefinitions'][number] & { relationshipType: typeof relationshipType })['stateDefinition']>>>>
                        }>(`
                            MATCH (fromNode:${fromNode.nodeType} {nodeId: $fromNode.nodeId})-[relationship:${relationshipType as string}]->(toNode:${toNode.nodeType})
                            RETURN relationship
                        `, { fromNode, toNode })
                    }).then(({ records }) => records.length ? records.map(record => record.get('relationship').properties)[0] : null)
                    // Delete the 'toNode' from the db as it shouldn't have. This may be a poor design. Come back to this later
                    if (result) {
                        return Err(UixErr('Normal', 'LayerImplementationError', { message: `Relationship of type ${relationshipType} from node ${fromNode.nodeType} to node ${toNode.nodeType} already exists` }))
                    }
                }
                // If needed create toNode
                if ('nodeId' in toNode) {
                    toNode = toNode
                } else {
                    const toNodeKeyOrResult = await thisGraphLayer.createNode(toNode.nodeType, toNode.initialState)
                    if (!toNodeKeyOrResult.ok) return toNodeKeyOrResult
                    toNode = toNodeKeyOrResult.val
                }
                const executeWriteResult = await session.executeWrite(async tx => {
                    const txRes = await tx.run<{
                        fromNode: Node<Integer, UixNode<typeof fromNode.nodeType, TypeOf<(TypeArgs['nodeDefinitions'][number] & { nodeType: typeof fromNode.nodeType })['stateDefinition']>>>,
                        relationship: Relationship<Integer, UixRelationship<typeof relationshipType, TypeOf<NonNullable<(TypeArgs['relationshipDefinitions'][number] & { nodeType: typeof fromNode.nodeType })['stateDefinition']>>>>,
                        toNode: Node<Integer, UixNode<typeof toNode.nodeType, TypeOf<(TypeArgs['nodeDefinitions'][number] & { nodeType: typeof toNode.nodeType })['stateDefinition']>>>
                    }>(`
                        MATCH (fromNode:${fromNode.nodeType} {nodeId: $fromNode.nodeId})
                        MATCH (toNode:${toNode.nodeType} {nodeId: $toNode.nodeId})
                        MERGE (fromNode)-[relationship:${relationshipType as string}]->(toNode)
                        SET relationship += $state
                        RETURN fromNode, toNode, relationship
                    `, { fromNode, toNode, state: state ?? {} })
                    return txRes
                }).then(({ records }) => records.map(record => {
                    return {
                        fromNode: record.get('fromNode').properties,
                        relationship: record.get('relationship').properties,
                        toNode: record.get('toNode').properties
                    }
                })[0])
                return Ok({
                    fromNode: executeWriteResult.fromNode,
                    relationship: executeWriteResult.relationship,
                    toNode: executeWriteResult.toNode
                })
            } catch (_e) {
                const e = _e as Error
                return Err(UixErr('Fatal', 'LayerImplementationError', { message: e.message }))
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
                        toNode: Node<Integer, UixNode<typeof toNodeType, TypeOf<(TypeArgs['nodeDefinitions'][number] & { nodeType: typeof toNodeType })['stateDefinition']>>>
                    }>(`
                        MATCH (fromNode:${nodeType} {nodeId: $fromNodeId})-[:${relationshipType as string}]->(toNode:${toNodeType})
                        RETURN toNode
                    `, { fromNodeId: nodeId })
                }).then(({ records }) => {
                    console.log(`RECORDS: `, records.map(record => record.get('toNode').properties))
                    return relationshipDictionary[relationshipType].uniqueFromNode
                        ? records.length ? records.map(record => record.get('toNode').properties)[0] : null
                        : records.map(record => record.get('toNode').properties)
                })
                console.log(`RESULT:`, result)
                if (!result) return Err(UixErr('Normal', 'NodeNotFound', { message: `Node of type ${toNodeType} related to node ${nodeType} with ${nodeId} not found` }))
                return Ok(result as any)   // TS is struggling to infer this. But it is correct
            } catch (_e) {
                const e = _e as Error
                return Err(UixErr('Fatal', 'LayerImplementationError', { message: e.message }))
            } finally {
                await session.close()
            }
        }
    }
    return thisGraphLayer
}





