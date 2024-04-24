import { UixError } from "@/src/base/UixError"
import { Driver } from "neo4j-driver"


export const createUniqueIndex = async (
    neo4jDriver: Driver,
    nodeType: string,
    propertyName: string
) => {
    // Create Neo4j session
    const neo4jSession = neo4jDriver.session()
    try {
        console.log(`Creating unique index for ${nodeType}.${propertyName}`)
        return await neo4jSession.executeWrite(async tx => tx.run(`
            CREATE CONSTRAINT ${propertyName}_index IF NOT EXISTS
            FOR (node:${nodeType})
            REQUIRE node.${propertyName} IS UNIQUE
        `))
    } catch (error) {
        throw new UixError('Fatal', 'Error creating unique index in Neo4j', {
            cause: error
        })
    } finally {
        neo4jSession.close()
    }
}