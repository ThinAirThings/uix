import neo4j from 'neo4j-driver';
import { UixNode, defineNode } from '../../base/UixNode';
import { createUniqueIndex } from './createUniqueIndex';
import { createVectorNodeIndexes } from './createVectorIndex';
import { ZodObject } from 'zod';


export type NodeDefinition = {
    new(...args: any[]): InstanceType<ReturnType<typeof defineNode>>
    create: (initialState: any) => InstanceType<ReturnType<typeof defineNode>>
    nodeType: string
    stateDefinition: ZodObject<any>
}

export const configureNeo4jLayer = (config: {
    uri: string,
    user: string,
    password: string
}) => {
    const neo4jDriver = neo4j.driver(config.uri, neo4j.auth.basic(
        config.user,
        config.password
    ))
    const vectorIndexesCreated = createVectorNodeIndexes(neo4jDriver)
    return <
        T extends NodeDefinition,
    >(
        NodeType: T, config: {
            uniqueIndexes?: T extends new (...args: any[]) => infer N ? (keyof (N extends UixNode ? N['state'] : never) & string)[] : never
            vectorIndexes?: T extends new (...args: any[]) => infer N ? (keyof (N extends UixNode ? N['state'] : never) & string)[] : never
        }
    ) => {
        // Create Unique Indexes
        const uniqueIndexesCreated = [
            createUniqueIndex(neo4jDriver, NodeType.nodeType, 'nodeId'),
            ...(config.uniqueIndexes && config.uniqueIndexes.map(index => {
                return createUniqueIndex(neo4jDriver, NodeType.name.replace('Node', ''), index)
            })) ?? []
        ]
        return class Neo4jLayeredNode extends NodeType {
            static create = async (state: T extends UixNode ? T['state'] : never) => {
                const newNode = new NodeType(state)
                if (!neo4jDriver) throw new Error('Neo4jNode.neo4jDriver is not configured')
                const neo4jSession = neo4jDriver.session();
                // Create node in Neo4j
                try {
                    // Wait for indexes to be created if not complete
                    await Promise.all([vectorIndexesCreated, ...uniqueIndexesCreated])
                    const stateKeys = Object.keys(newNode.state).map((key) => {
                        return `${key}: $${key}`
                    }).join(', ')
                    await neo4jSession.executeWrite(async tx => {
                        return await tx.run(`
                            CREATE (node:${NodeType.nodeType} {
                                nodeId: $nodeId,
                                createdAt: $createdAt,
                                updatedAt: $updatedAt,
                                ${stateKeys}
                            })
                            RETURN node
                        `, { ...newNode, ...newNode.state })
                    })
                    return new Neo4jLayeredNode(state)
                } catch (error) {
                    console.error('Error creating node in Neo4j', error)
                } finally {
                    neo4jSession.close()
                }
            }
            static hydrate = async (hydration: {
                nodeId: string,
                createdAt: string,
                updatedAt?: string,
                initialState: T extends UixNode ? T['state'] : never
            }) => {
                if (!neo4jDriver) throw new Error('Neo4jNode.neo4jDriver is not configured')
                const neo4jSession = neo4jDriver.session();
                // Get node from Neo4j
                try {
                    const result = await neo4jSession.executeRead(async tx => {
                        return await tx.run(`
                            MATCH (node:${NodeType.nodeType} {nodeId: $nodeId})
                            RETURN node
                        `, { nodeId: hydration.nodeId })
                    })
                    return new NodeType(result.records[0].get('node').properties)
                } catch (error) {
                    console.error('Error getting node from Neo4j', error)
                } finally {
                    neo4jSession.close()
                }
            }
            constructor(...args: any[]) {
                super(...args)
            }
            static get = async (nodeId: string) => {
                if (!neo4jDriver) throw new Error('Neo4jNode.neo4jDriver is not configured')
                const neo4jSession = neo4jDriver.session();
                // Get node from Neo4j
                try {
                    const result = await neo4jSession.executeRead(async tx => {
                        return await tx.run(`
                            MATCH (node:${NodeType.nodeType} {nodeId: $nodeId})
                            RETURN node
                        `, { nodeId })
                    })
                    return new NodeType(result.records[0].get('node').properties)
                } catch (error) {
                    console.error('Error getting node from Neo4j', error)
                } finally {
                    neo4jSession.close()
                }
            }

            update(state: Partial<T extends UixNode ? T['state'] : never>) {
                super.update(state)
                if (!neo4jDriver) throw new Error('Neo4jNode.neo4jDriver is not configured')
                const neo4jSession = neo4jDriver.session();
                // Update node in Neo4j
                (async () => {
                    try {
                        const propertiesString = Object.entries(this).map(([key, value]) => {
                            return `${key}: $${key}`
                        }).join(', ')
                        await neo4jSession.executeWrite(async tx => {
                            return await tx.run(`
                                MATCH (node:${this.nodeType} {nodeId: $nodeId})
                                SET node = {
                                    ${propertiesString}
                                }
                                RETURN node
                            `, { ...this })
                        })
                    } catch (error) {
                        console.error('Error updating node in Neo4j', error)
                    } finally {
                        neo4jSession.close()
                    }
                })()
            }
        }
    }
}

