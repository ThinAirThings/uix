// tests/nodeCreation.test.ts
import { testGraph } from "../testGraph";
import { expect, test } from '@jest/globals';


describe('Node Creation', () => {
    test('should create a User node with correct properties', async () => {
        const graph = testGraph;
        const userData = { name: 'Alice', email: 'alice@example.com', password: 'secure123' };
        const userNode = await graph.createNode('User', userData);
        if (!userNode.ok) {
            throw new Error(`Failed to create User node: ${userNode.val}`);
        }
        expect(userNode.val.nodeType).toBe('User');
        expect(userNode.val).toMatchObject(userData);
    });

    // Additional tests for other node types...
});
