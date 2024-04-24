import { configureNeo4jExtension } from "./src/extensions/Neo4j/configureNeo4jExtension";
import { UserNode } from "./src/nodes/UserNode";




const Neo4jExtension = configureNeo4jExtension({
    uri: 'bolt://localhost:7687',
    user: 'neo4j',
    password: 'testpassword'
})

const NeoUserNode = Neo4jExtension(UserNode, {
    uniqueIndexes: ['name'],
    vectorIndexes: ['name']
})

const userNode = new NeoUserNode('John Doe')

// const userNode = new UserNode('John Doe')
console.log(userNode)

