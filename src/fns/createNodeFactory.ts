import { Driver, EagerResult, Integer, Node } from "neo4j-driver"
import { v4 as uuid } from 'uuid'
import { AnyZodObject, TypeOf, z, ZodType, ZodTypeAny } from "zod"
import { neo4jAction, neo4jDriver } from "../clients/neo4j"
import { AnyNodeDefinitionMap, GenericNodeDefinition, NodeShape } from "../definitions/NodeDefinition"
import { UixErr, Ok, UixErrSubtype, AnyErrType } from "../types/Result"
import { Action } from "../types/Action"
import { GenericNodeKey, NodeKey } from "../types/NodeKey"
import { isZodDiscriminatedUnion } from "../utilities/isZodDiscriminatedUnion"
import { DependencyTypeSet, RelationshipDefinition } from "../definitions/RelationshipDefinition"


// export type GenericCreateNodeAction = Action<
//     [GenericNodeKey, Capitalize<string>, Record<string, any>, string?],
//     Record<string, any>,
//     AnyErrType
// >
/**
 * Factory for creating an action to create a node in the database
 * @param neo4jDriver The neo4j driver to use
 * @param nodeTypeMap The node type map to use
 * @returns The create node action
 */

// (NodeDefinitionMap[FromNodeTypeSet]['relationshipDefinitionSet'][number]['type']) |

type DependencyRelationshipTypeSet<NodeDefinitionMap extends AnyNodeDefinitionMap, NodeType extends keyof NodeDefinitionMap, Dependency extends DependencyTypeSet> =
    (NodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number] & { dependency: Dependency }) extends RelationshipDefinition<infer FromNodeDefinition, infer RelationshipType, infer Cardinality, infer Dependency, infer ToNodeDefinition, infer StateSchema>
    ? RelationshipDefinition<FromNodeDefinition, RelationshipType, Cardinality, Dependency, ToNodeDefinition, StateSchema>
    : never
export const createNodeFactory = <
    NodeDefinitionMap extends AnyNodeDefinitionMap,
>(
    nodeTypeMap: NodeDefinitionMap
) => neo4jAction(async <
    NodeType extends keyof NodeDefinitionMap,
    InitialState extends TypeOf<NodeDefinitionMap[NodeType]['stateSchema']>
>({
    nodeType,
    strongRelationshipMap,
    weakRelationshipMap,
    initialState,
    providedNodeId
}: {
    nodeType: NodeType,
    strongRelationshipMap: {
        [StrongRelationshipType in DependencyRelationshipTypeSet<NodeDefinitionMap, NodeType, 'strong'>['type']]: (DependencyRelationshipTypeSet<NodeDefinitionMap, NodeType, 'strong'> & { type: StrongRelationshipType })['stateSchema'] extends ZodType<infer A, infer B, infer C>
        ? ({
            to: DependencyRelationshipTypeSet<NodeDefinitionMap, NodeType, 'strong'>['cardinality'] extends ('one-to-one' | 'many-to-one')
            ? NodeKey<NodeDefinitionMap, DependencyRelationshipTypeSet<NodeDefinitionMap, NodeType, 'strong'>['toNodeDefinition']['type']>
            : NodeKey<NodeDefinitionMap, DependencyRelationshipTypeSet<NodeDefinitionMap, NodeType, 'strong'>['toNodeDefinition']['type']>[]
            state: TypeOf<ZodType<A, B, C>>
        })
        : ({
            to: DependencyRelationshipTypeSet<NodeDefinitionMap, NodeType, 'strong'>['cardinality'] extends ('one-to-one' | 'many-to-one')
            ? NodeKey<NodeDefinitionMap, DependencyRelationshipTypeSet<NodeDefinitionMap, NodeType, 'strong'>['toNodeDefinition']['type']>
            : NodeKey<NodeDefinitionMap, DependencyRelationshipTypeSet<NodeDefinitionMap, NodeType, 'strong'>['toNodeDefinition']['type']>[]
        })
    },
    weakRelationshipMap?: {
        [WeakRelationshipType in DependencyRelationshipTypeSet<NodeDefinitionMap, NodeType, 'weak'>['type']]?: (DependencyRelationshipTypeSet<NodeDefinitionMap, NodeType, 'weak'> & { type: WeakRelationshipType })['stateSchema'] extends ZodType<infer A, infer B, infer C>
        ? ({
            to: DependencyRelationshipTypeSet<NodeDefinitionMap, NodeType, 'weak'>['cardinality'] extends ('one-to-one' | 'many-to-one')
            ? NodeKey<NodeDefinitionMap, DependencyRelationshipTypeSet<NodeDefinitionMap, NodeType, 'weak'>['toNodeDefinition']['type']>
            : NodeKey<NodeDefinitionMap, DependencyRelationshipTypeSet<NodeDefinitionMap, NodeType, 'weak'>['toNodeDefinition']['type']>[]
            state: TypeOf<ZodType<A, B, C>>
        })
        : ({
            to: DependencyRelationshipTypeSet<NodeDefinitionMap, NodeType, 'weak'>['cardinality'] extends ('one-to-one' | 'many-to-one')
            ? NodeKey<NodeDefinitionMap, DependencyRelationshipTypeSet<NodeDefinitionMap, NodeType, 'weak'>['toNodeDefinition']['type']>
            : NodeKey<NodeDefinitionMap, DependencyRelationshipTypeSet<NodeDefinitionMap, NodeType, 'weak'>['toNodeDefinition']['type']>[]
        })
    },
    initialState: InitialState,
    providedNodeId?: string
}) => {
    // Check Schema
    const stateSchema = (<GenericNodeDefinition>nodeTypeMap[nodeType]!)['stateSchema']
    const newNodeStructure = isZodDiscriminatedUnion(stateSchema)
        ? z.union(stateSchema.options.map((option: AnyZodObject) => option.merge(z.object({
            nodeId: z.string(),
            nodeType: z.string()
        }))) as [AnyZodObject, AnyZodObject, ...AnyZodObject[]]).parse({
            ...initialState,
            nodeId: providedNodeId ?? uuid(),
            nodeType: nodeType
        })
        : stateSchema.extend({
            nodeId: z.string(),
            nodeType: z.string()
        }).parse({
            ...initialState,
            nodeId: providedNodeId ?? uuid(),
            nodeType: nodeType
        })
    console.log("Creating", nodeType, newNodeStructure)
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
            set node += $childNode,
                node:Node,
                node.updatedAt = timestamp()
        with node, $strongRelationshipMap as strongRelMap, $weakRelationshipMap as weakRelMap
        // Process strong relationships
        unwind keys(strongRelMap) as strongRelType
        unwind strongRelMap[strongRelType] as strongRelNodeKey
        with node, strongRelType, strongRelNodeKey, strongRelMap[strongRelType].state as state
        match (strongRelNode:Node {nodeId: strongRelNodeKey.nodeId})
        call apoc.create.relationship(node, strongRelType, apoc.map.merge(state, {strength: 'strong'}), strongRelNode) yield rel
        // Process weak relationships if they exist
        ${weakRelationshipMap && Object.keys(weakRelationshipMap).length > 0
            ? /*cypher*/`
            with node, weakRelMap
            unwind keys(weakRelMap) as weakRelType
            unwind weakRelMap[weakRelType].to as weakRelNodeKey
            with node, weakRelType, weakRelNodeKey, weakRelMap[weakRelType].state as state
            match (weakRelNode:Node {nodeId: weakRelNodeKey.nodeId})
            call apoc.create.relationship(node, weakRelType, apoc.map.merge(state, {strength: 'weak'}), weakRelNode) yield rel
            `
            : ''
        }
        return node
    `, {
        strongRelationshipMap: Object.entries<{
            to: NodeKey<NodeDefinitionMap, keyof NodeDefinitionMap> | NodeKey<NodeDefinitionMap, keyof NodeDefinitionMap>[],
            state: Record<string, any>
        } | {
            to: NodeKey<NodeDefinitionMap, keyof NodeDefinitionMap> | NodeKey<NodeDefinitionMap, keyof NodeDefinitionMap>[]
        }>(strongRelationshipMap).reduce((acc, [relType, relData]) => {
            if ('state' in relData) {
                acc[relType] = {
                    to: Array.isArray(relData.to) ? relData.to : [relData.to],
                    state: relData.state
                }
                return acc
            }
            acc[relType] = {
                to: Array.isArray(relData.to) ? relData.to : [relData.to],
                state: {}
            }
            return acc
        }, {} as Record<string, {
            to: NodeKey<NodeDefinitionMap, keyof NodeDefinitionMap>[]
            state: Record<string, any>
        }>),
        weakRelationshipMap: weakRelationshipMap ? Object.entries<{
            to: NodeKey<NodeDefinitionMap, keyof NodeDefinitionMap> | NodeKey<NodeDefinitionMap, keyof NodeDefinitionMap>[],
            state: Record<string, any>
        } | {
            to: NodeKey<NodeDefinitionMap, keyof NodeDefinitionMap> | NodeKey<NodeDefinitionMap, keyof NodeDefinitionMap>[]
        } | undefined>(weakRelationshipMap).reduce((acc, [relType, relData]) => {
            if (!relData) return acc
            if ('state' in relData) {
                acc[relType] = {
                    to: Array.isArray(relData.to) ? relData.to : [relData.to],
                    state: relData.state
                }
                return acc
            }
            acc[relType] = {
                to: Array.isArray(relData.to) ? relData.to : [relData.to],
                state: {}
            }
            return acc
        }, {} as Record<string, {
            to: NodeKey<NodeDefinitionMap, keyof NodeDefinitionMap>[]
            state: Record<string, any>
        }>) : {},
        newNode: newNodeStructure
    }).then(res => res.records[0]?.get('node').properties)
    if (!node) return UixErr({
        subtype: UixErrSubtype.CREATE_NODE_FAILED,
        message: `Failed to create node of type ${nodeType as string}`,
        data: { nodeType, initialState, weakRelationshipMap, strongRelationshipMap }
    });
    return Ok(node)
})


// RelationshipType extends (NodeDefinitionMap[FromNodeTypeSet]['relationshipDefinitionSet'][number]['type']) | ({
//     [RelationshipDefinitionIdx in keyof NodeDefinitionMap[keyof NodeDefinitionMap]['relationshipDefinitionSet']]: 
//         NodeDefinitionMap[keyof NodeDefinitionMap]['relationshipDefinitionSet'][RelationshipDefinitionIdx] extends RelationshipDefinition<infer FromNodeDefinition, infer RelationshipType, infer Cardinality, infer Dependency, infer ToNodeDefinition>
//             ? FromNodeTypeSet extends ToNodeDefinition['type'] ? RelationshipType : never
//             : never
// }[keyof NodeDefinitionMap[keyof NodeDefinitionMap]['relationshipDefinitionSet']]),