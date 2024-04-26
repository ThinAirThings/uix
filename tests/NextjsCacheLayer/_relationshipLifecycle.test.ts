// tests/relationshipCreation.test.ts
import { defineNeo4jLayer, defineNextjsCacheLayer } from "../../dist";
import { testGraph } from "../testGraph";


// NOTE: I don't think this can be tested outside of a nextjs environment
describe('Relationship Lifecycle Nextjs Cache', () => {
    test('should create a WORKED_AT relationship between two nodes', async () => {
        const graph = defineNextjsCacheLayer(defineNeo4jLayer(testGraph, {
            connection: {
                uri: 'bolt://localhost:7687',
                username: 'neo4j',
                password: 'testpassword'
            }
        }));
        // Assuming 'HAS_FRIEND' is a defined relationship in your graph
        // and 'User' nodes can have a 'HAS_FRIEND' relationship with each other.
        const aliceData = { name: 'Alice', email: 'alice@example.com', password: 'secure123' };
        const companyData = { name: 'Blueprint' };
        const getUserNodeResult = await graph.getNode('User', 'email', aliceData.email);
        if (getUserNodeResult.ok) {
            console.log("User already exists, deleting node");
            expect(getUserNodeResult.val.nodeType).toBe('User');
            const deleteNodeResult = await graph.deleteNode(getUserNodeResult.val);
            if (!deleteNodeResult.ok) {
                throw new Error(`Failed to delete User node: ${deleteNodeResult.val.message}`);
            }
        }
        const getCompanyNodeResult = await graph.getNode('Company', 'nodeId', companyData.name);
        if (getCompanyNodeResult.ok) {
            console.log("Company already exists, deleting node");
            expect(getCompanyNodeResult.val.nodeType).toBe('Company');
            const deleteNodeResult = await graph.deleteNode(getCompanyNodeResult.val);
            if (!deleteNodeResult.ok) {
                throw new Error(`Failed to delete Company node: ${deleteNodeResult.val.message}`);
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
    });

    // Add more test cases to cover other types of relationships and error cases.
});
