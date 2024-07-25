import { EagerResult, Integer, Node } from "neo4j-driver"
import { v4 as uuid } from 'uuid'
import { AnyZodObject, TypeOf, z } from "zod"
import { neo4jAction, neo4jDriver } from "../clients/neo4j"
import { AnyNodeDefinitionMap, GenericNodeDefinition, NodeShape } from "../definitions/NodeDefinition"
import { UixErr, Ok, UixErrSubtype } from "../types/Result"
import { isZodDiscriminatedUnion } from "../utilities/isZodDiscriminatedUnion"
import { formatRelationshipMap, GenericRelationshipMap } from "../utilities/formatRelationshipMap"
import { IsPartial, RelationshipMergeMap } from "../types/RelationshipMergeMap"

/**
 * Factory for creating an action to create a node in the database
 * @param neo4jDriver The neo4j driver to use
 * @param nodeDefinitionMap The node type map to use
 * @returns The create node action
 */

export const mergeNodeFactory = <
    NodeDefinitionMap extends AnyNodeDefinitionMap,
>(
    nodeDefinitionMap: NodeDefinitionMap
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
} & (Operation extends 'create' ? (({
    nodeType: NodeType,
    state: MergeState,
    nodeId?: string
    weakRelationshipMap?: RelationshipMergeMap<NodeDefinitionMap, NodeType, 'weak'>
}) & (
        IsPartial<{
            strongRelationshipMap: RelationshipMergeMap<NodeDefinitionMap, NodeType, 'strong'>
        }, undefined extends RelationshipMergeMap<NodeDefinitionMap, NodeType, 'strong'> ? true : false>
    )) : ({
        nodeType: NodeType,
        nodeId: string
        state?: Partial<MergeState>,
        strongRelationshipMap?: undefined,
        weakRelationshipMap?: RelationshipMergeMap<NodeDefinitionMap, NodeType, 'weak'>
    }))) => {
    // Check Schema
    const stateSchema = (<GenericNodeDefinition>nodeDefinitionMap[nodeType]!)['stateSchema']
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
    console.log(operation === 'create' ? "Creating" : 'Updating', nodeType, newNodeStructure)
    // console.log("Weak Relationships", JSON.stringify(weakRelationshipMap, null, 2))
    const relationshipMap = {
        ...formatRelationshipMap(nodeDefinitionMap, nodeType as Capitalize<string>, strongRelationshipMap as GenericRelationshipMap), 
        ...formatRelationshipMap(nodeDefinitionMap, nodeType as Capitalize<string>, weakRelationshipMap as GenericRelationshipMap)
    }
    console.log("Relationship Map", JSON.stringify(relationshipMap, null, 2))
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
        // Process relationshipMap
        ${relationshipMap && Object.keys(relationshipMap).length > 0
            ? /*cypher*/`
            with node, $relationshipMap as relationshipMapRef
            unwind keys(relationshipMapRef) as relationshipType
            with node, relationshipType, relationshipMapRef[relationshipType] as relationshipData
            unwind (case when relationshipData.to is not null then relationshipData.to else relationshipData.from end) as connectingRelationshipEntry
            with node, relationshipData, connectingRelationshipEntry, relationshipType, relationshipData.strength as strength, relationshipData.cardinality as cardinality
            match (connectingNode:Node {nodeId: connectingRelationshipEntry.nodeKey.nodeId})
            call apoc.merge.relationship(
                case when relationshipData.to is not null then node else connectingNode end,
                relationshipType,
                {relationshipType: relationshipType, strength: strength, cardinality: cardinality},
                connectingRelationshipEntry.state,
                case when relationshipData.to is not null then connectingNode else node end,
                connectingRelationshipEntry.state
            ) yield rel
        ` : ''}
        return node
    `, {
        relationshipMap,
        newNode: newNodeStructure
    }).then(res => {
        // console.log(JSON.stringify(res.records, null, 2))
        return res.records[0]?.get('node').properties
    })
    if (!node) return UixErr({
        subtype: UixErrSubtype.CREATE_NODE_FAILED,
        message: `Failed to create node of type ${nodeType as string}`,
        data: { nodeType, state, strongRelationshipMap }
    });
    return Ok(node)
})


        // ${strongRelationshipMap && Object.keys(strongRelationshipMap).length > 0
        //     ? /*cypher*/`
        //     with node, $strongRelationshipMap as strongRelMap
        //     unwind keys(strongRelMap) as strongRelType
        //     unwind strongRelMap[strongRelType].to as strongRelNodeKey
        //     with node, strongRelType, strongRelNodeKey, strongRelMap[strongRelType].state as state
        //     match (strongRelNode:Node {nodeId: strongRelNodeKey.nodeId})
        //     call apoc.create.relationship(node, strongRelType, apoc.map.merge(state, {strength: 'strong'}), strongRelNode) yield rel
        // ` : ''}
        // // Process relationshipMap
        // ${relationshipMap && Object.keys(relationshipMap).length > 0
        //     ? /*cypher*/`
        //     with node, $weakRelationshipMap as weakRelMap
        //     unwind keys(weakRelMap) as weakRelType
        //     with node, weakRelType, weakRelMap[weakRelType] as relData
        //     unwind (case when relData.to is not null then relData.to else relData.from end) as weakRelNodeKey
        //     with node, weakRelType, weakRelNodeKey, relData.state as state, relData
        //     match (weakRelNode:Node {nodeId: weakRelNodeKey.nodeId})
        //     call apoc.merge.relationship(
        //         case when relData.to is not null then node else weakRelNode end,
        //         weakRelType,
        //         {strength: 'weak', relationshipType: weakRelType, cardinality: },
        //         state,
        //         case when relData.to is not null then weakRelNode else node end,
        //         state
        //     ) yield rel
        // ` : ''}


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