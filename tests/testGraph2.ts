import { z } from "zod"
import neo4j, { EagerResult, Integer, Neo4jError, Node } from 'neo4j-driver'
import { createUniqueIndex } from "@/src/layers/Neo4j/createUniqueIndex"
import { Err, GraphLayer, Ok, UixNode } from "@/src"
import { defineLayer } from "@/src/base/Layer/defineLayer"


const Neo4jLayer = defineLayer('Neo4j')
    .configuration(z.object({
        url: z.string(),
        username: z.string(),
        password: z.string()
    }))
    .initializer((graph, config) => {
        const neo4jDriver = neo4j.driver(config.url, neo4j.auth.basic(
            config.username,
            config.password
        ))
        const uniqueIndexes = graph.uniqueIndexes
        // Create Unique Indexes
        const uniqueIndexesCreated = [
            ...graph.nodeDefinitions.map(async ({ nodeType }) => createUniqueIndex(neo4jDriver, nodeType, 'nodeId')),
            ...(uniqueIndexes && (Object.entries(uniqueIndexes)).map(async ([nodeType, _indexes]) => {
                const indexes = _indexes as string[]
                return await Promise.all(indexes.map(async (index) => await createUniqueIndex(neo4jDriver, nodeType as string, index as string)))
            })) ?? []
        ]
        return {
            uniqueIndexesCreated,
            driver: neo4j.driver(config.url, neo4j.auth.basic(config.username, config.password))
        }
    })
    .createNode(async (graph, UixErr, nodeType, initialState, { driver, uniqueIndexesCreated }) => {
        await Promise.all(uniqueIndexesCreated)
        const newNode = await graph.createNode(nodeType, initialState) //as unknown as UixNode<typeof nodeType, TypeOf<(N[number] & { nodeType: typeof nodeType })['stateDefinition']>>
        if (!driver) throw new Error('Neo4jNode.neo4jDriver is not configured')
        return await driver.executeQuery<EagerResult<{
            node: Node<Integer, UixNode<typeof nodeType, any>>
        }>>(`
                CREATE (node:${nodeType} $newNode)
                RETURN node
            `, { newNode: newNode.ok ? newNode.val : {} })
            .then(({ records }) => Ok(records.map(record => record.get('node').properties)[0]))
            .catch((e: Neo4jError) => e.message === 'Neo.ClientError.Schema.ConstraintValidationFailed'
                ? Err(UixErr('Normal', 'UniqueIndexViolation', { message: e.message }))
                : Err(UixErr('Fatal', 'LayerImplementationError', { message: e.message }))
            )
    })

const res = Neo4jLayer(null as unknown as GraphLayer, {

})