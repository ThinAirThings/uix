import { EagerResult } from "neo4j-driver"
import { neo4jAction, neo4jDriver } from "../clients/neo4j"
import { AnyNodeDefinitionMap } from "../definitions/NodeDefinition"
import { NodeKey } from "../types/NodeKey"
import { Ok } from "../types/Result"
import { RelationshipCollectMap } from "../types/RelationshipCollectMap"





export const collectNodeFactory = <
    NodeTypeMap extends AnyNodeDefinitionMap,
>(
    nodeTypeMap: NodeTypeMap
) => neo4jAction(async <
    NodeType extends keyof NodeTypeMap,
>(params: ({
    nodeType: NodeType 
}) & (
    ({
        referenceType: 'nodeType'
    }) | ({
        referenceType: 'nodeIndex'
        indexKey: NodeTypeMap[NodeType]['uniqueIndexes'][number]
        indexValue: string
    })
) & ({
    relatedWith?: RelationshipCollectMap<NodeTypeMap, NodeType>
})
) => {
    // console.log("Deleting", nodeKey)
    // // First, retrieve parent node information
    // await neo4jDriver().executeQuery<EagerResult<{
    //     parentNodeId: string,
    //     parentNodeType: string
    // }>>(/*cypher*/ `
    //     match (n: Node {nodeId: $nodeKey.nodeId})<-[strongRelationship *0.. {strength: "strong"}]-(connectedNode)
    //     detach delete n
    //     with distinct connectedNode
    //     match (connectedNode)-[{strength: "strong"}]->(strongConnectedNode)
    //     with connectedNode, count(strongConnectedNode) as strongConnectedNodeCount
    //     where strongConnectedNodeCount < 1
    //     detach delete connectedNode
    // `, {
    //     nodeKey
    // })
    return Ok(true)
})