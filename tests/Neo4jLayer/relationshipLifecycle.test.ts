// tests/relationshipCreation.test.ts
import { defineNeo4jLayer } from "../../dist";
import { testGraph } from "../testGraph";

describe('Relationship Lifecycle Neo4j', () => {
    test('should create a WORKED_AT relationship between two nodes', async () => {
        const graph = defineNeo4jLayer(testGraph, {
            connection: {
                uri: 'bolt://localhost:7687',
                username: 'neo4j',
                password: 'testpassword'
            }
        });
        // Check empty state createion
        const emptyStateNode = await graph.createNode('Profile', {});
        if (!emptyStateNode.ok) {
            throw new Error(`Failed to create empty state node: ${emptyStateNode.val.message}`);
        }
        // Assuming 'HAS_FRIEND' is a defined relationship in your graph
        // and 'User' nodes can have a 'HAS_FRIEND' relationship with each other.
        const aliceData = { name: 'Alice', email: 'alice@example.com', password: 'secure123' };
        const companyData = { name: 'Blueprint' };
        const getUserNodeResult = await graph.getNode('User', 'email', aliceData.email);
        if (getUserNodeResult.ok) {
            const userNode = getUserNodeResult.val;
            if (userNode) {
                console.log("User already exists, deleting node");
                expect(userNode.nodeType).toBe('User');
                const deleteNodeResult = await graph.deleteNode(userNode);
                if (!deleteNodeResult.ok) {
                    throw new Error(`Failed to delete User node: ${deleteNodeResult.val.message}`);
                }
            }
        }
        const getCompanyNodeResult = await graph.getNode('Company', 'nodeId', companyData.name);
        if (getCompanyNodeResult.ok) {
            const companyNode = getCompanyNodeResult.val;
            if (companyNode) {
                expect(companyNode.nodeType).toBe('Company');
                const deleteNodeResult = await graph.deleteNode(companyNode);
                if (!deleteNodeResult.ok) {
                    throw new Error(`Failed to delete Company node: ${deleteNodeResult.val.message}`);
                }
            }
        }
        const aliceNodeResult = await graph.createNode('User', aliceData);
        const companyNodeResult = await graph.createNode('Company', companyData);

        if (!aliceNodeResult.ok || !companyNodeResult.ok) {
            throw new Error(`Failed to create nodes for relationship test: ${aliceNodeResult.val}, ${companyNodeResult.val}`);
        }

        const relationshipResult = await graph.createRelationship(
            { nodeType: 'User', nodeId: aliceNodeResult.val.nodeId },
            'WORKED_AT',
            { nodeType: 'Company', nodeId: companyNodeResult.val.nodeId }
        );

        if (!relationshipResult.ok) {
            throw new Error(`Failed to create relationship: ${relationshipResult.val.message}`);
        }
        expect(relationshipResult.val).toHaveProperty('relationship');
        // expect(relationshipResult.val.relationship.relationshipType).toBe('WORKED_AT');
        expect(relationshipResult.val.fromNode.nodeId).toBe(aliceNodeResult.val.nodeId);
        expect(relationshipResult.val.toNode.nodeId).toBe(companyNodeResult.val.nodeId);
        // Test Related To
        const relatedToResult = await graph.getRelatedTo(
            aliceNodeResult.val,
            'WORKED_AT',
            'Company'
        );
        if (!relatedToResult.ok) {
            throw new Error(`Failed to get related nodes: ${relatedToResult.val.message}`);
        }

        // Write tests to check that the related node
        expect(relatedToResult.val.length).toBeGreaterThan(0);
        expect(relatedToResult.val[0].nodeId).toBe(companyNodeResult.val.nodeId);
        const companyNode = relatedToResult.val[0];
        // Test Updates
        const createEmptyCompanyNodeResult = await graph.createNode('Company', {});
        if (!createEmptyCompanyNodeResult.ok) {
            throw new Error(`Failed to create empty company node: ${createEmptyCompanyNodeResult.val.message}`);
        }
        const emptyCompanyNode = createEmptyCompanyNodeResult.val;
        await graph.updateNode(emptyCompanyNode, { name: 'Cheese Fries' });
        const updatedNodeResult = await graph.getNode('Company', 'nodeId', emptyCompanyNode.nodeId);
        if (!updatedNodeResult.ok) {
            throw new Error(`Failed to get updated node: ${updatedNodeResult.val.message}`);
        }
        if (!updatedNodeResult.val) {
            throw new Error(`Updated node is null`);
        }
        expect(updatedNodeResult.val.nodeType).toBe('Company');
        expect(updatedNodeResult.val.name).toBe('Cheese Fries');
    });

    // Add more test cases to cover other types of relationships and error cases.
});
