import OpenAI from "openai"
import { GenericNodeShape, GenericNodeType } from "../types/NodeType"
import { Driver, EagerResult, Integer, Node } from "neo4j-driver"
import { Ok, UixErr, UixErrSubtype } from "../types/Result"
import { openAIAction } from "../clients/openai"
import { neo4jAction } from "../clients/neo4j"
import dedent from "dedent"
import { GenericMatchToRelationshipType } from "../types/MatchToRelationshipType"



export const upsertMatchTypeEmbedding = async (
    neo4jDriver: Driver,
    openaiClient: OpenAI,
    triggerNode: GenericNodeShape,
    fromNodeType: GenericNodeType,
    matchToRelationshipType: GenericMatchToRelationshipType
) => {
    // Try/catch this because you're not going to handle it with application logic.
    // You'll just log it.
    const result = await neo4jAction(openAIAction(async () => {
        // Create Node Type Summary
        console.log("Creating Match Type Summary (nodeTypeEmbedding)", fromNodeType.type)
        // Collect all nodes in weightedNodeTypeSet
        const {
            targetNode,
            weightedNodeSet
        } = await neo4jDriver.executeQuery<EagerResult<{
            weightedNode: Node<Integer, GenericNodeShape>,
            targetNode: Node<Integer, GenericNodeShape>
        }>>(dedent/*cypher*/`
            // Get the node that initiated the change as a reference point 
            match (triggerNode:${triggerNode.nodeType} {nodeId: $triggerNode.nodeId})
            // Get the parent node that is the target of this update
            match (targetNode: ${fromNodeType.type})<-[:CHILD_TO|UNIQUE_TO*]-(triggerNode)
            // Get all nodes in the weightedNodeTypeSet
            match (targetNode)<-[:CHILD_TO|UNIQUE_TO*]-(weightedNode: ${matchToRelationshipType.weightedNodeTypeSet.map(({ NodeType }) => NodeType.type).join('|')})
            return weightedNode, targetNode
        `, {
            triggerNode
        }).then(res => ({
            targetNode: res.records[0].get('targetNode').properties,
            weightedNodeSet: res.records.map(record => record.get('weightedNode').properties)
        }))
        const { type, description } = matchToRelationshipType
        const nodeTypeSummary = await openaiClient.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content:
                        `You are an AI designed to write a paragraph about a ${type} as if you were writing a paragraph designated to define a '${type.toUpperCase()}Type'.\n`
                        + `A '${type.toUpperCase()}Type' is an abstract representation of a ${type} such that the information represents the properties of a ${type} in a way that encodes the ${type} to be semantically complete and follows the following description: ${description}.\n`
                        + `Your job is to generate the '${type.toUpperCase()}Type' paragraph to the best of your ability.\n`
                        + `The '${type.toUpperCase()}Type' paragraph should fully represent the '${type.toUpperCase()}Type' as it was defined.\n`
                        + `Your will receive information in a JSON.stringified format that you will use to generate the '${type.toUpperCase()}Type' paragraph.\n`
                        + `You should ignore information that is not relevant to the '${type.toUpperCase()}Type' paragraph as it was defined.\n`
                }, {
                    role: 'user',
                    content: `The JSON data to use is: ${JSON.stringify(Object.fromEntries(weightedNodeSet.map(node => ([node.nodeType, node]))))}`
                }
            ]
        }).then(res => res.choices[0].message.content ?? '')
        const nodeTypeEmbedding = await openaiClient.embeddings.create({
            model: 'text-embedding-3-large',
            input: nodeTypeSummary
        }).then(res => res.data[0].embedding)
        // Update Node
        const vectorNode = await neo4jDriver.executeQuery<EagerResult<{
            vectorNode: Node<Integer, GenericNodeShape>
        }>>(/*cypher*/`
            match (targetNode:${targetNode.nodeType} {nodeId: $targetNode.nodeId})
            merge (vectorNode:${targetNode.nodeType}Vector:${matchToRelationshipType.type} {nodeId: $targetNode.nodeId})-[:VECTOR_TO]->(targetNode)
            on create
                set vectorNode += $vectorNodeStructure
            on match 
                set vectorNode += $vectorNodeStructure
            return vectorNode
        `, {
            targetNode,
            vectorNodeStructure: {
                nodeTypeSummary,
                nodeTypeEmbedding
            }
        }).then(res => res.records[0].get('vectorNode').properties)
        if (!vectorNode) return UixErr({
            subtype: UixErrSubtype.UPDATE_NODE_FAILED,
            message: `Upsert match relationship error`,
            data: {
                targetNode,
                matchToRelationshipType
            }
        });
        return Ok(targetNode)
    }))()
    const { data, error } = result
    if (data) return data
    if (error.type === 'Neo4jErr') {
        // Note! You could do some logging here
        console.error("Neo4j Error", error)
    }
    if (error.type === 'OpenAIError') {
        console.error("OpenAI Error", error)
    }
}