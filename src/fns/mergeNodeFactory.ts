import { Driver, EagerResult, Integer, Node } from "neo4j-driver"
import { v4 as uuid } from 'uuid'
import { AnyZodObject, TypeOf, z, ZodType, ZodTypeAny } from "zod"
import { neo4jAction, neo4jDriver } from "../clients/neo4j"
import { AnyNodeDefinitionMap, GenericNodeDefinition, NodeShape } from "../definitions/NodeDefinition"
import { UixErr, Ok, UixErrSubtype, AnyErrType } from "../types/Result"
import { GenericNodeKey, NodeKey } from "../types/NodeKey"
import { isZodDiscriminatedUnion } from "../utilities/isZodDiscriminatedUnion"
import { AnyRelationshipDefinition, StrengthTypeSet, RelationshipDefinition } from "../definitions/RelationshipDefinition"
import { formatRelationshipMap, GenericRelationshipMap } from "../utilities/formatRelationshipMap"
import { RelativeRelationshipMap } from "../types/RelationshipMap"


/**
 * Factory for creating an action to create a node in the database
 * @param neo4jDriver The neo4j driver to use
 * @param nodeTypeMap The node type map to use
 * @returns The create node action
 */

export const mergeNodeFactory = <
    NodeDefinitionMap extends AnyNodeDefinitionMap,
>(
    nodeTypeMap: NodeDefinitionMap
) => neo4jAction(async <
    Operation extends 'create' | 'update',
    NodeType extends keyof NodeDefinitionMap,
    MergeState extends TypeOf<NodeDefinitionMap[NodeType]['stateSchema']>
>({
    operation,
    nodeType,
    strongRelationshipMap,
    weakRelationshipMap,
    state,
    nodeId
}: {
    operation: Operation,
} & (Operation extends 'create' ? ({
    nodeType: NodeType,
    state: MergeState,
    nodeId?: string
} & RelativeRelationshipMap<NodeDefinitionMap, NodeType, 'strong'>
    & RelativeRelationshipMap<NodeDefinitionMap, NodeType, 'weak'>
) : ({
    nodeType: NodeType,
    nodeId: string
    state?: Partial<MergeState>,
    strongRelationshipMap?: undefined,
} & RelativeRelationshipMap<NodeDefinitionMap, NodeType, 'weak'>))) => {
    // Check Schema
    const stateSchema = (<GenericNodeDefinition>nodeTypeMap[nodeType]!)['stateSchema']
    const newNodeStructure = operation === 'create'
        ? isZodDiscriminatedUnion(stateSchema)
            ? z.union(stateSchema.options.map((option: AnyZodObject) => option.merge(z.object({
                nodeId: z.string(),
                nodeType: z.string()
            }))) as [AnyZodObject, AnyZodObject, ...AnyZodObject[]]).parse({
                ...state,
                nodeId: nodeId ?? uuid(),
                nodeType: nodeType
            })
            : stateSchema.extend({
                nodeId: z.string(),
                nodeType: z.string()
            }).parse({
                ...state,
                nodeId: nodeId ?? uuid(),
                nodeType: nodeType
            })
        : isZodDiscriminatedUnion(stateSchema)
            ? z.union(stateSchema.options.map((option: AnyZodObject) => option.extend({
                nodeId: z.string(),
                nodeType: z.string()
            }).partial()) as [AnyZodObject, AnyZodObject, ...AnyZodObject[]]).parse({
                ...(state ?? {}),
                nodeId,
                nodeType
            })
            : stateSchema.extend({
                nodeId: z.string(),
                nodeType: z.string()
            }).partial().parse({
                ...(state ?? {}),
                nodeId,
                nodeType
            })
    console.log("NodeKey", nodeId, nodeType)
    console.log("Creating", nodeType, newNodeStructure)
    console.log("Strong Relationships", JSON.stringify(formatRelationshipMap(strongRelationshipMap as GenericRelationshipMap), null, 2))
    console.log("Weak Relationships", JSON.stringify(formatRelationshipMap(weakRelationshipMap as GenericRelationshipMap), null, 2))
    // console.log("Weak Relationships", JSON.stringify(weakRelationshipMap, null, 2))
    const node = await neo4jDriver().executeQuery<EagerResult<{
        node: Node<Integer, NodeShape<NodeDefinitionMap[NodeType]>>
    }>>(/* cypher */ `
        merge (node:Node:${nodeType as string} {nodeId: $newNode.nodeId})
        on create
            set node += $newNode,
                node:Node,
                node.createdAt = timestamp(),
                node.updatedAt = timestamp()

        on match 
            set node += $newNode,
                node:Node,
                node.updatedAt = timestamp()
        // Process strong relationships
        ${strongRelationshipMap && Object.keys(strongRelationshipMap).length > 0
            ? /*cypher*/`
            with node, $strongRelationshipMap as strongRelMap
            unwind keys(strongRelMap) as strongRelType
            unwind strongRelMap[strongRelType].to as strongRelNodeKey
            with node, strongRelType, strongRelNodeKey, strongRelMap[strongRelType].state as state
            match (strongRelNode:Node {nodeId: strongRelNodeKey.nodeId})
            call apoc.create.relationship(node, strongRelType, apoc.map.merge(state, {strength: 'strong'}), strongRelNode) yield rel
        ` : ''}
        // Process weak relationships
        ${weakRelationshipMap && Object.keys(weakRelationshipMap).length > 0
            ? /*cypher*/`
            with node, $weakRelationshipMap as weakRelMap
            unwind keys(weakRelMap) as weakRelType
            with node, weakRelType, weakRelMap[weakRelType] as relData
            unwind (case when relData.to is not null then relData.to else relData.from end) as weakRelNodeKey
            with node, weakRelType, weakRelNodeKey, relData.state as state, relData
            match (weakRelNode:Node {nodeId: weakRelNodeKey.nodeId})
            call apoc.merge.relationship(
                case when relData.to is not null then node else weakRelNode end,
                weakRelType,
                {strength: 'weak'},
                state,
                case when relData.to is not null then weakRelNode else node end,
                state
            ) yield rel
        ` : ''}
        return node
    `, {
        strongRelationshipMap: formatRelationshipMap(strongRelationshipMap as GenericRelationshipMap),
        weakRelationshipMap: formatRelationshipMap(weakRelationshipMap as GenericRelationshipMap),
        newNode: newNodeStructure
    }).then(res => {
        console.log("Neo4j Response", JSON.stringify(res, null, 2))
        console.log(JSON.stringify(res.records, null, 2))
        return res.records[0]?.get('node').properties
    })
    console.log("Node Result", node)
    if (!node) return UixErr({
        subtype: UixErrSubtype.CREATE_NODE_FAILED,
        message: `Failed to create node of type ${nodeType as string
            }`,
        data: { nodeType, state, strongRelationshipMap }
    });
    return Ok(node)
})


// ${weakRelationshipMap && Object.keys(weakRelationshipMap).length > 0
//     ? /*cypher*/`
//     with node, $weakRelationshipMap as weakRelMap
//     unwind keys(weakRelMap) as weakRelType
//     with node, weakRelType, weakRelMap[weakRelType] as relData
//     unwind (case when relData.to is not null then relData.to else relData.from end) as weakRelNodeKey
//     with node, weakRelType, weakRelNodeKey, relData.state as state, relData
//     match (weakRelNode:Node {nodeId: weakRelNodeKey.nodeId})
//     call apoc.create.relationship(
//         case when relData.to is not null then node else weakRelNode end,
//         weakRelType,
//         apoc.map.merge(state, {strength: 'weak'}),
//         case when relData.to is not null then weakRelNode else node end
//     ) yield rel
// ` : ''}