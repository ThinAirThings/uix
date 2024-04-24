import { configureNeo4jLayer } from "./src/layers/Neo4j/configureNeo4jLayer";
import { z, TypeOf, ZodObject } from 'zod'
import { configureNeo4jLayer2 } from "./src/layers/Neo4j/configureNeo4jLayer2";
import { defineGraph } from "./src/base/defineGraph";
import { defineNode } from "./src/base/defineNode";
import { graph } from "neo4j-driver";





// const userNodeDefinition = defineNode(
//     'User' as const,
//     z.object({
//         name: z.string(),
//         email: z.string().email(),
//         password: z.string()
//     })
// )

// const graph = defineGraph({
//     nodeDefinitions: [
//         defineNode(
//             'User' as const,
//             z.object({
//                 name: z.string(),
//                 email: z.string().email(),
//                 password: z.string()
//             })
//         ),
//         defineNode(
//             'Post' as const,
//             z.object({
//                 title: z.string(),
//                 content: z.string()
//             })
//         )
//     ] as const
// })

// graph.createNode('Post', {
//     title: 'Hello World',
//     content: 'This is a test post'
// })

// graph.createNode('User', {
//     'email'
// })
const Neo4jLayer = configureNeo4jLayer2({
    uri: 'bolt://localhost:7687',
    user: 'neo4j',
    password: 'testpassword'
})
const neoGraph = Neo4jLayer(defineGraph({
    nodeDefinitions: [
        defineNode(
            'User' as const,
            z.object({
                name: z.string(),
                email: z.string().email(),
                password: z.string()
            }),
            ['HAS_POST']
        ),
        defineNode(
            'Post' as const,
            z.object({
                title: z.string(),
                content: z.string()
            }),
            ['HAS_USER']
        )
    ] as const
}), {
    uniqueIndexes: {
        'User': ['email'],
        'Post': ['title']
    }
})
const userNode = await neoGraph.getNode('User', 'email', 'dan@dan.com')
console.log(userNode)
// const post = await neoGraph.createNode('Post', {
//     title: 'Hello World',
//     content: 'This is a test post'
// })
const postNode = await neoGraph.getNode('Post', 'title','Goodbye World')
const updatedPostNode = await neoGraph.updateNode(postNode, {
    title: 'Goodbye World',
})
await neoGraph.createRelationship(userNode, 'HAS_POST', updatedPostNode)
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
