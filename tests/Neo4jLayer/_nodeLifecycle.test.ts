

// tests/nodeCreation.test.ts
import { Neo4jLayer } from "../../dist";
import { testGraph } from "../testGraph";

describe('Node Lifecycle', () => {
    test('should create a User node with correct properties', async () => {
        const graph = Neo4jLayer(testGraph, {
            connection: {
                uri: 'bolt://localhost:7687',
                user: 'neo4j',
                password: 'testpassword'
            }
        });
        const userData = { name: 'Alice', email: 'alice@example.com', password: 'secure123' };
        const getUserNodeResult = await graph.getNode('User', 'email', userData.email);
        if (getUserNodeResult.ok) {
            console.log("User already exists, deleting node");
            const deleteNodeResult = await graph.deleteNode(getUserNodeResult.val);
            if (!deleteNodeResult.ok) {
                await graph.neo4jDriver.close();
                throw new Error(`Failed to delete User node: ${deleteNodeResult.val.message}`);
            }
        }
        const userNode = await graph.createNode('User', userData);
        if (!userNode.ok) {
            await graph.neo4jDriver.close();
            throw new Error(`Failed to create User node: ${userNode.val.message}`);
        }
        expect(userNode.val.nodeType).toBe('User');
        expect(userNode.val).toMatchObject(userData);
        await graph.neo4jDriver.close();
    });
});
