import { Driver, EagerResult, Integer, Node } from "neo4j-driver"
import { neo4jAction, neo4jDriver } from "../clients/neo4j"
import { AnyNodeTypeMap, NodeShape } from "../definitions/NodeDefinition"
import { Ok } from "../types/Result"
import neo4j from 'neo4j-driver'





export const getAllOfNodeTypeFactory = <
    NodeTypeMap extends AnyNodeTypeMap,
>(
    nodeTypeMap: NodeTypeMap,
) => neo4jAction(async <
    NodeType extends keyof NodeTypeMap,
>({
    nodeType,
    options
}: {
    nodeType: NodeType,
    options?: {
        limit?: number
        page?: number
        orderBy?: 'updatedAt' | 'createdAt';
        orderDirection?: 'ASC' | 'DESC';
    }
}) => {
    console.log("Getting all nodes of type", nodeType)
    // Setup filter
    const limit = options?.limit ?? 10;
    const page = options?.page ?? 1;
    const skip = (page - 1) * limit;
    const orderBy = options?.orderBy ?? 'updatedAt';
    const orderDirection = options?.orderDirection ?? 'ASC';

    const nodes = await neo4jDriver().executeQuery<EagerResult<{
        node: Node<Integer, NodeShape<NodeTypeMap[NodeType]>>
    }>>(/*cypher*/`
        match (node:${nodeType as string}) 
        return node   
        order by node.${orderBy} ${orderDirection}
        skip $skip
        limit $limit
    `, {
        skip: neo4j.int(skip),
        limit: neo4j.int(limit)
    }).then(res => res.records.map(record => record.get('node').properties))
    return Ok(nodes)
})