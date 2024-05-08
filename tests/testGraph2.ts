import { TypeOf, z } from "zod"
import neo4j, { EagerResult, Integer, Neo4jError, Node } from 'neo4j-driver'
import { createUniqueIndex } from "@/src/layers/Neo4j/createUniqueIndex"
import { Err, GraphLayer, Ok, UixNode } from "@/src"
import { NodeDefinition } from "@/src/base/Node/NodeDefinition"
import { LayerDefinition } from "@/src/base/Layer/LayerDefinition"
import { RelationshipDefinition } from "@/src/base/Relationship/RelationshipDefinition"
import { GraphDefinition } from "@/src/base/Graph/GraphDefinition"



const userNodeDefinition = NodeDefinition
    .define('User', z.object({
        name: z.string(),
        email: z.string().email(),
        password: z.string(),
        providerId: z.string().optional()
    }))
    .defineUniqueIndexes(['email', 'password'])
    .defineDefaults({
        'email': ''
    })

const postNodeDefinition = NodeDefinition
    .define('Post', z.object({
        title: z.string(),
        content: z.string(),
        published: z.boolean()
    }))
    .defineUniqueIndexes(['title'])

const friendsWithRelationshipDefinition = RelationshipDefinition
    .constrain([userNodeDefinition])
    .define(['User'], 'FRIENDS_WITH', ['User'])
    .defineStateSchema(z.object({
        since: z.number()
    }))

const likesRelationshipDefinition = RelationshipDefinition
    .constrain([userNodeDefinition, postNodeDefinition])
    .define(['User'], 'LIKES', ['Post'])

const graphDefinition = GraphDefinition
    .define([
        userNodeDefinition,
        postNodeDefinition,
    ], [
        friendsWithRelationshipDefinition,
        likesRelationshipDefinition
    ])


const thing = null as unknown as TypeOf<typeof userNodeDefinition['stateDefaultSchema']>
const indexes = null as unknown as typeof userNodeDefinition['uniqueIndexes'][number]
const Neo4jLayer = LayerDefinition
    .define('Neo4j')
    .defineConfiguration(z.object({
        url: z.string(),
        username: z.string(),
        password: z.string()
    }))
    .defineInitializer((graph, config) => {
        const neo4jDriver = neo4j.driver(config.url, neo4j.auth.basic(
            config.username,
            config.password
        ))
        // Create Unique Indexes
        const uniqueIndexesCreated = graph.nodeDefinitions.map(
            ({ nodeType, uniqueIndexes }) => uniqueIndexes.map(uniqueIndex => createUniqueIndex(neo4jDriver, nodeType, uniqueIndex))
        ).flat()
        
        return {
            uniqueIndexesCreated,
            driver: neo4j.driver(config.url, neo4j.auth.basic(config.username, config.password))
        }
    })
    .defineCreateNode(async (graph, nodeType, intialState, UixError, deps) => {
        // Wait for index creation to complete
        await Promise.all(deps.uniqueIndexesCreated)
        if (nodeType === 'cheese') {
            return Ok(null as unknown as UixNode<'Cheese', { name: string }>)
        }
        return UixError('NoNode', 'fdsa')
        // await Promise.all(uniqueIndexesCreated)
        // const newNode = await graph.createNode(nodeType, initialState) //as unknown as UixNode<typeof nodeType, TypeOf<(N[number] & { nodeType: typeof nodeType })['stateDefinition']>>
        // if (!driver) throw new Error('Neo4jNode.neo4jDriver is not configured')
        // return await driver.executeQuery<EagerResult<{
        //     node: Node<Integer, UixNode<typeof nodeType, any>>
        // }>>(`
        //         CREATE (node:${nodeType} $newNode)
        //         RETURN node
        //     `, { newNode: newNode.ok ? newNode.val : {} })
        //     .then(({ records }) => Ok(records.map(record => record.get('node').properties)[0]))
        //     .catch((e: Neo4jError) => e.message === 'Neo.ClientError.Schema.ConstraintValidationFailed'
        //         ? Err(UixErr('Normal', 'UniqueIndexViolation', { message: e.message }))
        //         : Err(UixErr('Fatal', 'LayerImplementationError', { message: e.message }))
        //     )
    })

const res = Neo4jLayer(graphDefinition, {
    username: 'neo4j',
    password: 'password',
    url: 'bolt://localhost:7687'
})

const createNodeResult = await res.createNode('User', {})

if (!createNodeResult.ok) {
    const error = createNodeResult.val
}