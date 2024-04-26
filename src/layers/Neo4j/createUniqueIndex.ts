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
        return await neo4jSession.executeWrite(async tx => await tx.run(`
            CREATE CONSTRAINT ${propertyName}_index IF NOT EXISTS
            FOR (node:${nodeType})
            REQUIRE node.${propertyName} IS UNIQUE
        `))
    } catch (error) {
        throw error
    } finally {
        await neo4jSession.close()
    }
}