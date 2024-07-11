

import { Driver, EagerResult, error, Integer, Node } from "neo4j-driver"
import { AnyNodeTypeMap, GenericNodeType, NodeShape, NodeState } from "../types/NodeType"
import { neo4jAction, neo4jDriver } from "../clients/neo4j"
import { UixErr, Ok, UixErrSubtype } from "../types/Result"
import OpenAI from "openai"
import { openAIAction } from "../clients/openai"
import { NodeKey } from "../types/NodeKey"
import { upsertVectorNode } from "../vectors/upsertVectorNode"
import { AnyZodObject, z, ZodDiscriminatedUnion, ZodObject } from "zod"
import { isZodDiscriminatedUnion } from "../utilities/isZodDiscriminatedUnion"


/**
 * Factory for creating an action to update a node in the database
 * @param neo4jDriver The neo4j driver to use
 * @param nodeTypeMap The node type map to use
 * @returns The update node action
 */
export const updateNodeFactory = <
    NodeTypeMap extends AnyNodeTypeMap
>(
    nodeTypeMap: NodeTypeMap
) => neo4jAction(openAIAction(async <
    NodeType extends NodeTypeMap[keyof NodeTypeMap]['type']
>({
    nodeKey,
    inputState
}: {
    nodeKey: NodeKey<NodeTypeMap, NodeType>,
    inputState: Partial<NodeState<NodeTypeMap[NodeType]>>
}) => {
    console.log("Updating", nodeKey, inputState)
    const stateSchema = (<GenericNodeType>nodeTypeMap[nodeKey.nodeType]!)['stateSchema']
    // Strip out any properties that are not in the schema
    const strippedNodeState = isZodDiscriminatedUnion(stateSchema)
        ? z.union(stateSchema.options.map((option: AnyZodObject) => option.partial()) as [AnyZodObject, AnyZodObject, ...AnyZodObject[]]).parse(inputState)
        : stateSchema.partial().parse(inputState)

    const node = await neo4jDriver().executeQuery<EagerResult<{
        node: Node<Integer, NodeShape<NodeTypeMap[NodeType]>>
    }>>(/*cypher*/`
        match (node:${nodeKey.nodeType} {nodeId: $nodeId})
        set node += $state,
            node.updatedAt = timestamp(),
            node:Node
        return node
    `, {
        nodeId: nodeKey.nodeId,
        state: {
            ...strippedNodeState,
        }
    }).then(res => res.records[0]?.get('node').properties)
    if (!node) return UixErr({
        subtype: UixErrSubtype.UPDATE_NODE_FAILED,
        message: `Failed to update node of type ${nodeKey.nodeType} with id ${nodeKey.nodeId}`,
        data: {
            nodeKey,
            inputState
        }
    });
    // Run Triggers
    // Note: This should really be broken out into an SQS event to prevent blocking the main thread
    // Arguably, optimistic updates with react-query also solves this.
    // NOTE: You should check what actually changes using immer here. You can probably have neo return the prevNode and currentNode
    await upsertVectorNode(node, nodeTypeMap)
    return Ok(node)
}))