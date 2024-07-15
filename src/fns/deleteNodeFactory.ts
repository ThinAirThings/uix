import { Driver, EagerResult } from "neo4j-driver"
import { neo4jAction, neo4jDriver } from "../clients/neo4j"
import { AnyNodeTypeMap } from "../definitions/NodeDefinition"
import { UixErr, Ok, UixErrSubtype } from "../types/Result"
import { NodeKey } from "../types/NodeKey"




/**
 * Factory for creating an action to delete a node in the database
 * @param neo4jDriver The neo4j driver to use
 * @param nodeTypeMap The node type map to use
 * @returns The delete node action
 */
export const deleteNodeFactory = <
    NodeTypeMap extends AnyNodeTypeMap,
>(
    nodeTypeMap: NodeTypeMap
) => neo4jAction(async ({
    nodeKey
}: {
    nodeKey: NodeKey<NodeTypeMap, keyof NodeTypeMap>
}) => {
    console.log("Deleting", nodeKey)
    // First, retrieve parent node information
    const parentNodeKeys = await neo4jDriver().executeQuery<EagerResult<{
        parentNodeId: string,
        parentNodeType: string
    }>>(/*cypher*/ `
        MATCH (parentNode)<-[:CHILD_TO|UNIQUE_TO]-(childNode:Node {nodeId: $nodeId})
        RETURN parentNode.nodeId as parentNodeId, parentNode.nodeType as parentNodeType
    `, {
        ...nodeKey
    }).then(result => result.records.map(record => ({
        parentNodeId: record.get('parentNodeId'),
        parentNodeType: record.get('parentNodeType')
    })));

    // Step 2: If parentNodeKeys retrieved successfully, then delete childNode
    if (parentNodeKeys.length > 0) {
        await neo4jDriver().executeQuery(/*cypher*/`
            match (childNode:Node {nodeId: $nodeId})<-[:CHILD_TO|UNIQUE_TO|VECTOR_TO*0..]-(recursiveChildNode)
            detach delete childNode
            detach delete recursiveChildNode
        `, {
            ...nodeKey
        });
    }
    console.log("Deleted", nodeKey)
    if (!parentNodeKeys.length) return UixErr({
        subtype: UixErrSubtype.DELETE_NODE_FAILED,
        message: `Failed to delete node of type ${nodeKey.nodeType as string} with id ${nodeKey.nodeId}`,
        data: {
            nodeKey
        }
    })
    return Ok(parentNodeKeys)
})

