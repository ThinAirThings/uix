import { UixNode } from "./base/UixNode";
import neo4j, { Driver } from 'neo4j-driver';
import { UserNode } from "./nodes/UserNode";


type Constructor = new (...args: any[]) => UixNode;

export const Neo4jNodeExtension = <T extends Constructor>(NodeType: T) => {
    return class extends NodeType {
        constructor(...args: any[]) {
            super(...args)
            if (!Neo4jNode.neo4jDriver) throw new Error('Neo4jNode.neo4jDriver is not configured')
            const neo4jSession = Neo4jNode.neo4jDriver.session()
                // Create node in Neo4j
                (async () => {
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
                })()
        }
    }
}


const NeoUserNode = Neo4jNodeExtension(UserNode)


export abstract class Neo4jNode extends UixNode {
    static configureNeo4jDriver = (neo4jConfig: {
        uri: string,
        user: string,
        password: string,
    }) => {
        Neo4jNode.neo4jDriver = neo4j.driver(
            neo4jConfig.uri,
            neo4j.auth.basic(
                neo4jConfig.user,
                neo4jConfig.password
            )
        )
    }
    static neo4jDriver: Driver
    constructor(
        nodeType: Neo4jNode['nodeType'],
        nodeProperties: Record<string, any>
    ) {
        if (!Neo4jNode.neo4jDriver) throw new Error('Neo4jNode.neo4jDriver is not configured')
        const neo4jSession = Neo4jNode.neo4jDriver.session()
        // Create underlying node 
        super(nodeType);
        // Create node in Neo4j
        (async () => {
            const propertiesString = Object.entries(nodeProperties).map(([key, value]) => {
                return `${key}: $${key}`
            }).join(', ')
            await neo4jSession.executeWrite(async tx => {
                return await tx.run(`
                    CREATE (node:${nodeType} {
                        nodeId: $nodeId,
                        nodeType: $nodeType,
                        createdAt: $createdAt,
                        ${propertiesString}
                    })
                    RETURN node
                `, {
                    nodeId: this.nodeId,
                    nodeType: this.nodeType,
                    createdAt: this.createdAt,
                    ...nodeProperties
                })
            })
        })()
    }
}


