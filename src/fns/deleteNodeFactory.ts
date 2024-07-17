import { Driver, EagerResult } from "neo4j-driver"
import { neo4jAction, neo4jDriver } from "../clients/neo4j"
import { UixErr, Ok, UixErrSubtype } from "../types/Result"
import { NodeKey } from "../types/NodeKey"
import { AnyNodeDefinitionMap } from "../definitions/NodeDefinition"




/**
 * Factory for creating an action to delete a node in the database
 * @param neo4jDriver The neo4j driver to use
 * @param nodeTypeMap The node type map to use
 * @returns The delete node action
 */
export const deleteNodeFactory = <
    NodeTypeMap extends AnyNodeDefinitionMap,
>(
    nodeTypeMap: NodeTypeMap
) => neo4jAction(async ({
    nodeKey
}: {
    nodeKey: NodeKey<NodeTypeMap, keyof NodeTypeMap>
}) => {
    console.log("Deleting", nodeKey)
    // First, retrieve parent node information
    await neo4jDriver().executeQuery<EagerResult<{
        parentNodeId: string,
        parentNodeType: string
    }>>(/*cypher*/ `
        match (n: Node {nodeId: $nodeKey.nodeId})<-[strongRelationship *0.. {strength: "strong"}]-(connectedNode)
        detach delete n
        with distinct connectedNode
        match (connectedNode)-[{strength: "strong"}]->(strongConnectedNode)
        with connectedNode, count(strongConnectedNode) as strongConnectedNodeCount
        where strongConnectedNodeCount < 1
        detach delete connectedNode
    `, {
        nodeKey
    })
    return Ok(true)
})






// // // THIS WORKS
// match (n:Node {nodeId: "b4aead03-1c8b-413a-8f19-95b30aab9528"})<-[strongRel *0.. {strength: "string"}]-(connectedNode)
// detach delete n
// with distinct connectedNode
// match (connectedNode)-[{strength: "strong"}]->(strongConnectedNode)
// with connectedNode, count(strongConnectedNode) as strongConnectedNodeCount
// where strongConnectedNodeCount = 1
// detach delete connectedNode



/* PROGRESS */
const deleteAllStrongChildNodesWith1StrongConnection = /*cypher*/`
    MATCH (n:Node {nodeId: "f0db0d91-d667-443f-a1ab-4ffa9e9b08e2"})
    CALL apoc.path.expandConfig(n, {
        relationshipFilter: '<',
        minLevel: 1,
        uniqueness: 'NODE_GLOBAL'
    }) YIELD path
    WITH path
    WHERE ALL(rel IN relationships(path) WHERE rel.strength = 'strong')
    UNWIND nodes(path) AS filteredNode
    with DISTINCT filteredNode
    MATCH (filteredNode)-[rel:strength]->(otherNode)
    WHERE rel.strength = 'strong'
    WITH filteredNode, count(otherNode) AS strongCount
    WHERE strongCount = 1
    DETACH DELETE filteredNode
`
const getAllStrongChildNodes = /*cypher*/`
    MATCH (n:Node {nodeId: "f0db0d91-d667-443f-a1ab-4ffa9e9b08e2"})
    CALL apoc.path.expandConfig(n, {
        relationshipFilter: '<',
        minLevel: 1,
        uniqueness: 'NODE_GLOBAL'
    }) YIELD path
    WITH path
    WHERE ALL(rel IN relationships(path) WHERE rel.strength = 'strong')
    UNWIND nodes(path) AS filteredNode
    RETURN DISTINCT filteredNode
`