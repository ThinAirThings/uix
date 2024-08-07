import { Driver, EagerResult, Integer, Node } from "neo4j-driver"
import { neo4jAction, neo4jDriver } from "../clients/neo4j"
import { AnyNodeTypeMap, GenericNodeType, NodeShape } from "../types/NodeType"
import { Ok, UixErr, UixErrSubtype } from "../types/Result"
import { isZodDiscriminatedUnion } from "../utilities/isZodDiscriminatedUnion"
import { AnyZodObject, z } from "zod"


export const getNodeByIndexFactory = <
    NodeTypeMap extends AnyNodeTypeMap,
>(
    nodeTypeMap: NodeTypeMap,
) => neo4jAction(async <
    NodeType extends keyof NodeTypeMap,
    UniqueIndex extends NodeTypeMap[NodeType]['uniqueIndexes'][number],
>({
    nodeType,
    indexKey,
    indexValue
}: {
    nodeType: NodeType,
    indexKey: UniqueIndex,
    indexValue: string
}) => {
    console.log(`Getting node of type ${nodeType as string} with index ${indexKey} = ${indexValue}`);

    const node = await neo4jDriver().executeQuery<EagerResult<{
        node: Node<Integer, NodeShape<NodeTypeMap[NodeType]>>
    }>>(/*cypher*/`
        match (node:${nodeType as string}) 
        where node.${indexKey} = $indexValue
        return node
        `, { indexValue }
    ).then(res => res.records[0]?.get('node').properties)
    if (!node) return UixErr({
        subtype: UixErrSubtype.GET_NODE_BY_INDEX_FAILED,
        message: `Failed to get node of type ${nodeType as string} with index ${indexKey} = ${indexValue}`,
        data: {
            nodeType,
            indexKey,
            indexValue
        }
    })
    const stateSchema = (<GenericNodeType>nodeTypeMap[nodeType]!)['stateSchema']
    return Ok(
        (isZodDiscriminatedUnion(stateSchema)
            ? z.union(stateSchema.options.map((option: AnyZodObject) => option.passthrough())).parse(node)
            : stateSchema.passthrough().parse(node)
        ) as NodeShape<NodeTypeMap[NodeType]>
    )
})