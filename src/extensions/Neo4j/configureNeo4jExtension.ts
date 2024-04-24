import neo4j from 'neo4j-driver';
import { UixNode } from '../../base/UixNode';
import { createUniqueIndex } from './createUniqueIndex';
import { createVectorNodeIndexes } from './createVectorIndex';


type Constructor = new (...args: any[]) => UixNode;

export const configureNeo4jExtension = (config: {
    uri: string,
    user: string,
    password: string
}) => {
    const neo4jDriver = neo4j.driver(config.uri, neo4j.auth.basic(
        config.user,
        config.password
    ))
    const vectorIndexesCreated = createVectorNodeIndexes(neo4jDriver)
    return <T extends Constructor>(
        NodeType: T, config: {
            uniqueIndexes?: T extends new (...args: any[]) => infer N ? (Exclude<keyof N, keyof UixNode>)[] : never
            vectorIndexes?: T extends new (...args: any[]) => infer N ? (Exclude<keyof N, keyof UixNode>)[] : never
        }
    ) => {
        // Check naming convention
        if (!NodeType.name.endsWith('Node')) throw new Error('Node class name must end with "Node"')

        // Create Unique Indexes
        const uniqueIndexesCreated = [
            createUniqueIndex(neo4jDriver, NodeType.name.replace('Node', ''), 'nodeId'),
            ...(config.uniqueIndexes && config.uniqueIndexes.map(index => {
                return createUniqueIndex(neo4jDriver, NodeType.name.replace('Node', ''), index)
            })) ?? []
        ]
        return class Neo4jExtendedNode extends NodeType {
            constructor(...args: any[]) {
                super(...args)
                if (!neo4jDriver) throw new Error('Neo4jNode.neo4jDriver is not configured')

                const neo4jSession = neo4jDriver.session();
                // Create node in Neo4j
                (async () => {
                    try {
                        // Wait for indexes to be created if not complete
                        await Promise.all([vectorIndexesCreated, ...uniqueIndexesCreated])
                        console.log("Finished creating indexes")
                        const propertiesString = Object.entries(this).map(([key, value]) => {
                            return `${key}: $${key}`
                        }).join(', ')
                        await neo4jSession.executeWrite(async tx => {
                            return await tx.run(`
                                CREATE (node:${this.nodeType} {
                                    ${propertiesString}
                                })
                                RETURN node
                            `, { ...this })
                        })
                    } catch (error) {
                        console.error('Error creating node in Neo4j', error)
                    } finally {
                        neo4jSession.close()
                    }
                })()
            }
        }
    }
}

