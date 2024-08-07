import { Driver, EagerResult, Integer, Node } from "neo4j-driver";
import { neo4jAction, neo4jDriver } from "../clients/neo4j";
import { AnyNodeTypeMap, NodeShape } from "../types/NodeType";
import { UixErr, Ok, UixErrSubtype } from "../types/Result";
import { NodeKey } from "../types/NodeKey";




/**
 * Factory for creating an action to get a node by key in the database
 * @param neo4jDriver The neo4j driver to use
 * @param nodeTypeMap The node type map to use
 * @returns The get node by key action
 */
export const getNodeByKeyFactory = <
    NodeTypeMap extends AnyNodeTypeMap,
>(
    nodeTypeMap: NodeTypeMap,
) => neo4jAction(async <
    NodeType extends keyof NodeTypeMap,
>({
    nodeKey
}: {
    nodeKey: NodeKey<NodeTypeMap, NodeType>
}) => {
    const node = await neo4jDriver().executeQuery<EagerResult<{
        node: Node<Integer, NodeShape<NodeTypeMap[NodeType]>>
    }>>(/*cypher*/`
        match (node:${nodeKey.nodeType as string} {nodeId: $nodeId}) 
        return node   
    `, { nodeId: nodeKey.nodeId }).then(res => res.records[0]?.get('node').properties)
    if (!node) return UixErr({
        subtype: UixErrSubtype.GET_NODE_BY_KEY_FAILED,
        message: `Failed to find node of type ${nodeKey.nodeType as string} with id ${nodeKey.nodeId}`,
        data: {
            nodeKey
        }
    })
    return Ok(node)
})