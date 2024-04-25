import { z } from 'zod'
import { Neo4jLayer } from "./src/layers/Neo4j/Neo4jLayer";
import { defineGraph } from "./src/base/defineGraph";
import { defineNode } from "./src/base/defineNode";
import { NextjsCacheLayer } from './src/layers/NextjsCache/NextjsCacheLayer';
// import { Neo4jLayer, defineGraph, defineNode, 
//     // NextjsCacheLayer 
// } from './dist'

const graph = defineGraph({
    nodeDefinitions: [
        defineNode('User' as const, z.object({
            name: z.string(),
            email: z.string().email(),
            password: z.string()
        })),
        defineNode('Post' as const, z.object({
            title: z.string(),
            content: z.string()
        })),
        defineNode('Company' as const, z.object({
            name: z.string()
        }))
    ],
    relationshipDefinitions: [{
        relationshipType: 'HAS_POST',
        stateDefinition: z.object({
            createdAt: z.string(),
            updatedAt: z.string()
        })
    }, {
        relationshipType: 'WORKED_AT'
    }],
    edgeDefinitions: {
        'User': {
            'HAS_POST': ['Post'] , 
            'WORKED_AT': ['Company'] 
        },
    } as const,
    uniqueIndexes: {
        'User': ['email'],
        'Post': ['title']
    }
})
graph.createNode('Company', {
    name: 'fdsa'
})
graph.createRelationship({nodeType: 'User', nodeId: '123'}, 'HAS_POST', {nodeType: 'Post', nodeId: '123'}, {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
})
// graph.getNode({nodeType: 'User', nodeId: '123'})

const neoGraph = Neo4jLayer(graph, {
    nodeDefinitions: graph.nodeDefinitions,
    relationshipDefinitions: graph.relationshipDefinitions,
    uniqueIndexes: graph.uniqueIndexes,
    edgeDefinitions: graph.edgeDefinitions
}, {
    connection: {
        uri: 'bolt://localhost:7687',
        user: 'neo4j',
        password: 'testpassword'
    }
})
const userNode = await neoGraph.getNode('User', 'email', 'dan@dan.com')
// const post = await neoGraph.createNode('Post', {
//     title: 'Hello World',
//     content: 'This is a test post'
// })
const postNode = await neoGraph.getNode('Post', 'nodeId', 'Goodbye World')
const updatedPostNode = await neoGraph.updateNode(postNode, {
    title: 'Goodbye World',
    thing: ''
})
await neoGraph.createRelationship(userNode, 'HAS_POST', postNode, {
    'createdAt': new Date().toISOString(),
    'updatedAt': new Date().toISOString()
})

// const posts = await neoGraph.getRelatedTo(userNode, 'HAS_POST', 'Post')
// console.log(posts)

const cacheGraph = NextjsCacheLayer(neoGraph, {
    nodeDefinitions: graph.nodeDefinitions,
    relationshipDefinitions: graph.relationshipDefinitions,
    uniqueIndexes: graph.uniqueIndexes,
    edgeDefinitions: graph.edgeDefinitions
})
cacheGraph.getNode('User', 'nodeId', 'fsda')
cacheGraph.getNode('User', 'email', '')
cacheGraph.updateNode(userNode, {
    name: 'John Doe'
})
// cacheGraph.getNode()
// console.log(updatedPostNode)
// neoGraph.createNode('User', {
//    'password'
// })
// const UserNode = Neo4jLayer(defineNode('User', z.object({
//     name: z.string(),
//     email: z.string().email(),
//     password: z.string()
// })), {
//     uniqueIndexes: ['email'],
//     vectorIndexes: ['name']
// })

// const user = UserNode.create({
//     name: 'Hello',
//     email: 'Dan@dan.com',
//     password: 'password'
// })
// console.log(user)
// user.update({
//     name: 'John Doe',
// })
