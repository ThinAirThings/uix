import { UixError } from "@/src/base/UixError"
import { Driver } from "neo4j-driver"



export const createVectorNodeIndexes = async (
    neo4jDriver: Driver
) => {
    // Create Neo4j session
    const neo4jSession = neo4jDriver.session()
    try {
        console.log(`Creating vector indexes`)
        return await neo4jSession.executeWrite(async tx => [
            tx.run(`
                CREATE VECTOR INDEX propertyKeys IF NOT EXISTS
                FOR (node:Vector) 
                ON (node.keyEmbedding)
                OPTIONS {indexConfig: {
                    \`vector.dimensions\`: 3072,
                    \`vector.similarity_function\`: "cosine"
                }}
            `),
            tx.run(`
                CREATE VECTOR INDEX propertyValues IF NOT EXISTS
                FOR (node:Vector)
                ON (node.valueEmbedding)
                OPTIONS {indexConfig: {
                    \`vector.dimensions\`: 3072,
                    \`vector.similarity_function\`: "cosine"
                }}
            `)
        ])
    } catch (error) {
        throw new UixError('Fatal', 'Error creating vector index in Neo4j', {
            cause: error
        })
    } finally {
        neo4jSession.close()
    }
}
