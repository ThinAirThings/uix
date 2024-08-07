import { Driver, EagerResult, Integer, Node } from "neo4j-driver"
import { v4 as uuid } from 'uuid'
import { AnyZodObject, TypeOf, z, ZodDiscriminatedUnion, ZodObject } from "zod"
import { neo4jAction, neo4jDriver } from "../clients/neo4j"
import { AnyNodeTypeMap, GenericNodeType, GenericNodeTypeMap, Neo4jNodeShape, NodeSetChildNodeTypes, NodeSetParentTypes, NodeShape } from "../types/NodeType"
import { ParentOfNodeSetTypes, SetNodeTypes } from "../types/types"
import { UixErr, Ok, UixErrSubtype, AnyErrType } from "../types/Result"
import { Action } from "../types/Action"
import OpenAI from "openai"
import { GenericNodeKey, NodeKey } from "../types/NodeKey"
import { upsertVectorNode } from "../vectors/upsertVectorNode"
import { isZodDiscriminatedUnion } from "../utilities/isZodDiscriminatedUnion"


export type GenericCreateNodeAction = Action<
    [GenericNodeKey, Capitalize<string>, Record<string, any>, string?],
    Record<string, any>,
    AnyErrType
>
/**
 * Factory for creating an action to create a node in the database
 * @param neo4jDriver The neo4j driver to use
 * @param nodeTypeMap The node type map to use
 * @returns The create node action
 */
export const createNodeFactory = <
    NodeTypeMap extends AnyNodeTypeMap,
>(
    nodeTypeMap: NodeTypeMap
) => neo4jAction(async <
    ParentOfNodeSetType extends ParentOfNodeSetTypes<NodeTypeMap>,
    SetNodeType extends SetNodeTypes<NodeTypeMap, ParentOfNodeSetType>,
    InitialState extends TypeOf<NodeTypeMap[SetNodeType]['stateSchema']>
>({
    parentNodeKeys,
    childNodeType,
    initialState,
    providedNodeId
}: {
    parentNodeKeys: NodeKey<NodeTypeMap, ParentOfNodeSetType>[],
    childNodeType: SetNodeType,
    initialState: InitialState,
    providedNodeId?: string
}) => {
    // Check Schema
    const stateSchema = (<GenericNodeType>nodeTypeMap[childNodeType]!)['stateSchema']
    const newNodeStructure = isZodDiscriminatedUnion(stateSchema)
        ? z.union(stateSchema.options.map((option: AnyZodObject) => option.merge(z.object({
            nodeId: z.string(),
            nodeType: z.string()
        }))) as [AnyZodObject, AnyZodObject, ...AnyZodObject[]]).parse({
            ...initialState,
            nodeId: providedNodeId ?? uuid(),
            nodeType: childNodeType
        })
        : stateSchema.extend({
            nodeId: z.string(),
            nodeType: z.string()
        }).parse({
            ...initialState,
            nodeId: providedNodeId ?? uuid(),
            nodeType: childNodeType
        })
    console.log("Creating", parentNodeKeys, childNodeType, newNodeStructure)
    const node = await neo4jDriver().executeQuery<EagerResult<{
        childNode: Node<Integer, NodeShape<NodeTypeMap[SetNodeType]>>
    }>>(/* cypher */ `
        merge (childNode:Node:${childNodeType} {nodeId: $childNode.nodeId})
        on create
            set childNode += $childNode,
                childNode:Node,
                childNode.createdAt = timestamp(),
                childNode.updatedAt = timestamp()

        on match 
            set childNode += $childNode,
                childNode:Node,
                childNode.updatedAt = timestamp()
        with childNode
        unwind $parentNodeKeys as parentNodeKey
        match (parentNode:Node {nodeId: parentNodeKey.nodeId})
        merge (childNode)-[:CHILD_TO]->(parentNode)
        return childNode
    `, {
        parentNodeKeys,
        childNode: newNodeStructure
    }).then(res => res.records[0]?.get('childNode').properties)
    if (!node) return UixErr({
        subtype: UixErrSubtype.CREATE_NODE_FAILED,
        message: `Failed to create node of type ${childNodeType} with parent keys ${parentNodeKeys}`,
        data: { parentNodeKeys, childNodeType, initialState }
    });
    // Triggers
    await upsertVectorNode(node, nodeTypeMap as GenericNodeTypeMap);
    return Ok(node)
})