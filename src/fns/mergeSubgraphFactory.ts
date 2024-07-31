import dedent from "dedent"
import { neo4jAction, neo4jDriver } from "../clients/neo4j"
import { AnyNodeDefinitionMap, GenericNodeShape, NodeShape, NodeState } from "../definitions/NodeDefinition"
import { Ok } from "../types/Result"
import { v4 as uuid } from 'uuid'
import {  AnyRelationshipDefinition, GenericRelationshipDefinition, GenericRelationshipShape, RelationshipState } from "../definitions/RelationshipDefinition"
import { GenericNodeKey} from "../types/NodeKey"
import { Draft, produce } from "immer"
import { EagerResult, Integer, Node, Path, Relationship } from "neo4j-driver"
import { RelationshipUnion } from "../types/RelationshipUnion"
import { writeFileSync } from "fs"



export type NodeStateTree<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    NodeType extends keyof NodeDefinitionMap,
> = (
    NodeState<NodeDefinitionMap[NodeType]>&{nodeId?:string}
) & {
    [Relationship in RelationshipUnion<NodeDefinitionMap, NodeType>]?: {
        nodeId?: string
    } & (Relationship extends `-${infer RelationshipType}->${infer RelatedNodeType}`
        ? NodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number] extends (infer RelationshipUnionRef extends AnyRelationshipDefinition | never)
            ? AnyRelationshipDefinition extends RelationshipUnionRef
                ? (RelationshipUnionRef&{type: RelationshipType})['cardinality'] extends `${string}-many`
                    ? (RelationshipState<RelationshipUnionRef&{type: RelationshipType}> & NodeStateTree<NodeDefinitionMap, RelatedNodeType>)[]
                    : RelationshipState<RelationshipUnionRef&{type: RelationshipType}> & NodeStateTree<NodeDefinitionMap, RelatedNodeType>
                : unknown
            : unknown
        : Relationship extends `<-${infer RelationshipType}-${infer RelatedNodeType}`
            ? NodeDefinitionMap[RelatedNodeType]['relationshipDefinitionSet'][number] extends (infer RelationshipUnionRef extends AnyRelationshipDefinition | never)
                ? AnyRelationshipDefinition extends RelationshipUnionRef
                    ? (RelationshipUnionRef&{type: RelationshipType})['cardinality'] extends `many-${string}`
                        ? (RelationshipState<RelationshipUnionRef&{type: RelationshipType}> & NodeStateTree<NodeDefinitionMap, RelatedNodeType>)[]
                        : RelationshipState<RelationshipUnionRef&{type: RelationshipType}> & NodeStateTree<NodeDefinitionMap, RelatedNodeType>
                    : unknown
                : unknown
            : unknown
    )
}

export const mergeSubgraphFactory = <
    NodeDefinitionMap extends AnyNodeDefinitionMap,
>(
    nodeDefinitionMap: NodeDefinitionMap
) => neo4jAction(async <
    NodeType extends keyof NodeDefinitionMap,
    Subgraph extends NodeShape<NodeDefinitionMap[NodeType]> | NodeState<NodeDefinitionMap[NodeType]>
>(subgraph: (
    ({
        nodeType: NodeType
    }) & Subgraph & (NodeStateTree<NodeDefinitionMap, NodeType>)
), 
    ...[updater]: Subgraph extends NodeShape<NodeDefinitionMap[NodeType]>
    ? [(draft: Draft<Subgraph>) => void] | []
    : []
) => {
    console.log("MERGING", JSON.stringify(subgraph))
    const removeRelationshipEntries = (subgraph: object) => Object.fromEntries(Object.entries(subgraph).filter(([key]) => !(key.includes('->') || key.includes('<-'))))
    const getRelationshipEntries = (subgraph: object) => Object.entries(subgraph).filter(([key]) => key.includes('->') || key.includes('<-'))
    const subgraphRef = (('createdAt' in subgraph  && updater) ? produce(subgraph, updater) : subgraph)
    // Flatten Tree 
    // Create Index Set
    const rootVariable = `n_t0_i0`
    let variableList = [rootVariable]
    let variableStateEntries = [
        [`${rootVariable}_state`, removeRelationshipEntries(subgraphRef!)],
    ]

    let queryString = dedent/*cypher*/`
        merge (${rootVariable}:${(subgraphRef as GenericNodeKey).nodeType} { 
            ${nodeDefinitionMap[subgraph.nodeType].uniqueIndexes
                .filter((index:string) => !!subgraph[index])
                .map((index: any) => `${index}: "${subgraph[index]}"`).join(', ')
            }
        })
        on create 
            set ${rootVariable}.nodeId = "${subgraph.nodeId ? subgraph.nodeId : uuid()}",
                ${rootVariable} += $${rootVariable}_state,
                ${rootVariable}:Node,
                ${rootVariable}.createdAt = timestamp(),
                ${rootVariable}.updatedAt = timestamp()
        on match
            set ${rootVariable} += $${rootVariable}_state,
                ${rootVariable}:Node,
                ${rootVariable}.updatedAt = timestamp() \n
    `
            // // Get Previous Node
            // match (n_${pathSegments.slice(0, pathSegments.length-2).join('_')})
    type RelationshipKey = `<-${string}-${string}-${string}` | `${string}-${string}->${string}`
    const relationToQueryString = (relationshipKey: RelationshipKey, relation: any, path: string, previousNodeType: string, relatedNodeIdSet: string[]) => {
        const pathSegments = path.split('_')
        const relationshipString = relationshipKey[0] === '<'
        ? `<-[r_${path}:${relationshipKey.split('-')[1]}]-`
        : `-[r_${path}:${relationshipKey.split('-')[1]}]->`
        const relationshipType = relationshipKey.split('-')[1]
        const nextNodeType = relation?.nodeType??pathSegments[2].replaceAll('>', '')
        const nextNodeIndexes = nodeDefinitionMap[nextNodeType].uniqueIndexes
            .filter((index:string) => !!relation[index]).length > 1
            ? nodeDefinitionMap[nextNodeType].uniqueIndexes
                .filter((index:string) => !!relation[index] && index !== 'nodeId')
                .map((index: any) => `${index}: "${relation[index]}"`).join(', ')
            : nodeDefinitionMap[nextNodeType].uniqueIndexes
                .filter((index:string) => !!relation[index])
                .map((index: any) => `${index}: "${relation[index]}"`).join(', ')

        queryString += dedent/*cypher*/`
            // Merge Next Node
            merge (n_${path}:${nextNodeType} { 
                ${nextNodeIndexes}
            })
            on create
                set n_${path} += $n_${path}_state,
                    n_${path}.nodeType = "${nextNodeType}",
                    n_${path}:Node,
                    n_${path}.createdAt = timestamp(),
                    n_${path}.updatedAt = timestamp()

            on match
                set n_${path} += $n_${path}_state,
                    n_${path}:Node,
                    n_${path}.updatedAt = timestamp()

            // Merge Relationship
            merge p_${path}=(n_${pathSegments.slice(0, pathSegments.length-2).join('_')})
            ${relationshipString}
            (n_${path})
            on create
                set r_${path}.relationshipType = "${relationshipType}",
                    r_${path} += $r_${path}_state,
                    r_${path}.strength = "${                 
                        nodeDefinitionMap[relationshipKey.includes('<') ? nextNodeType : previousNodeType]
                        .relationshipDefinitionSet.find(
                            (relationship: GenericRelationshipDefinition) => relationship.type === relationshipType
                        ).strength
                    }"
            on match
                set r_${path} += $r_${path}_state,
                    r_${path}.strength = "${                 
                        nodeDefinitionMap[relationshipKey.includes('<') ? nextNodeType : previousNodeType]
                        .relationshipDefinitionSet.find(
                            (relationship: GenericRelationshipDefinition) => relationship.type === relationshipType
                        ).strength
                    }"
            \n
        `
        variableList.push(`p_${path}`, `r_${path}`, `n_${path}`)
        const relationshipSchema = relationshipString.includes('<') 
            ? nodeDefinitionMap[relation.nodeType].relationshipDefinitionSet.find((relationship: GenericRelationshipDefinition) => relationship.type === relationshipType).stateSchema
            : nodeDefinitionMap[previousNodeType].relationshipDefinitionSet.find((relationship: GenericRelationshipDefinition) => relationship.type === relationshipType).stateSchema
        variableStateEntries.push(
            [`n_${path}_state`, nodeDefinitionMap[relation.nodeType].stateSchema.parse(removeRelationshipEntries(relation))],
            relationshipSchema ? [`r_${path}_state`, relationshipSchema.parse(removeRelationshipEntries(relation))] : [`r_${path}_state`, {}],
        )
        treeToQueryString(relation, `${path}`)
    }

    const treeToQueryString = (subgraph: any, path: string) => {
        console.log("PATH", path)
        getRelationshipEntries(subgraph).forEach(([key], t_idx) => {
            console.log("LOOPING", key)
            if (!(key.includes('<-') || key.includes('->'))) return
            const pathSegments = path.split('_')
            const nextNodeType = key.split('-')[2].replace('>', '') ?? pathSegments[2].replaceAll('>', '')
            const related = subgraph[key as keyof typeof subgraph]
            const relationshipType = key.split('-')[1]
            if (Array.isArray(related)) {
                // NOTE!! Passing in a map of undefined values causes neo4j to behave unexpectedly
                const relatedNodeIdSet = related.map((node: GenericNodeShape) => node.nodeId).filter(nodeId => nodeId !== undefined)
                console.log("RELATED NODE IDS", relatedNodeIdSet)
                // ---- Handle Deletion -----
                const relationshipString = key[0] === '<'
                ? `<-[r_${path}:${key.split('-')[1]}]-`
                : `-[r_${path}:${key.split('-')[1]}]->`
                queryString += dedent/*cypher*/`
                    // ---Handle Deletion--- (Node need to handle limit here as well)
                    with *
                    call {
                        with *  // <--- Ensure necessary variables are included
                        match (n_${path})
                        ${relationshipString.replace('r', 'dr')}
                        (dn_${`${path}_t`}:${nextNodeType})
                        where not dn_${`${path}_t`}.nodeId in $dn_${`${path}_t`}_relatedNodeIdSet
                        delete dr_${`${path}`}
                        
                        // Check for deletion of node
                        ${nodeDefinitionMap[nextNodeType]
                        .relationshipDefinitionSet
                        .some((relationship: GenericRelationshipDefinition) => relationship.strength === 'strong')
                            ? dedent/*cypher*/`
                                with dn_${`${path}_t`}
                                optional match (dn_${`${path}_t`})-[{strength: "strong"}]->(strongConnectedNode)
                                with dn_${`${path}_t`}, count(strongConnectedNode) as strongConnectedNodeCount
                                where strongConnectedNodeCount < 1
                                detach delete dn_${`${path}_t`}
                            `
                            : ''
                        }
                    }
                    // ---Handle Merge---
                    with *  // <--- Ensure necessary variables are included
                    \n
                `
                variableStateEntries.push([`dn_${`${path}_t`}_relatedNodeIdSet`, relatedNodeIdSet])
                // --- End Handle Deletion ---
                related.forEach((node, i_idx) => {
                    relationToQueryString(key as RelationshipKey, {
                        nodeType: nextNodeType,
                        nodeId: node.nodeId ?? uuid(),
                        ...node
                    }, `${path}_t${t_idx}_i${i_idx}`, subgraph.nodeType, relatedNodeIdSet)
                })
            } else {
                relationToQueryString(
                    key as RelationshipKey, {
                        nodeType: nextNodeType,
                        nodeId: related.nodeId ?? uuid(),
                        ...related
                    } as any, `${path}_t${t_idx}_i0`, subgraph.nodeType, [related.nodeId])
            }
        })
    }
    treeToQueryString(subgraphRef as any, `t0_i0`)
    // Add Return Statement
    queryString += dedent/*cypher*/`
        return ${variableList.join(', ')}
    `
    writeFileSync('tests/merge:queryString.cypher', queryString)
    const result = await neo4jDriver().executeQuery<EagerResult<{
        [Key: `p_${string}`]: Path<Integer>
    } & {
        [Key: `r_${string}`]: Relationship<Integer, GenericRelationshipShape>
    } & {
        [Key: `n_${string}`]: Node<Integer, GenericNodeShape>
    }>>(
        queryString, 
        Object.fromEntries(variableStateEntries)
    )
    .then(result => {

        writeFileSync('tests/merge:records.json', JSON.stringify(result.records, null, 2))
        
        const entityMap = result.records[0]
        const rootNode = result.records[0].get(rootVariable).properties
        const rootStringIndex = rootVariable 
        const buildTree = (node: GenericNodeShape & {[r: string]: GenericNodeShape[]}, nodeIndex: `n_${string}`) => {
            const pathIndexSet = variableList.filter(variable => 
                variable.startsWith(nodeIndex.replace('n', 'p')) 
                && nodeIndex.split('_').length === variable.split('_').length - 2
            ) as `p_${string}`[]
            pathIndexSet.forEach(pathIndex => {
                const path = entityMap.get(pathIndex).segments[0]
                const relationship = path.relationship as Relationship<Integer, GenericRelationshipShape>
                const rightEndcap = relationship.start === path.start.identity  ? '->' : '-'
                const leftEndcap = relationship.start === path.end.identity ? '<-' : '-'
                const nextNode = path.end.properties as GenericNodeShape
                const relationshipKey = `${leftEndcap}${relationship.type}${rightEndcap}${nextNode.nodeType}`
                const nextNodeMerged = {
                    ...relationship.properties,
                    ...nextNode,
                }
                node[relationshipKey] = node[relationshipKey] 
                    ? [...node[relationshipKey], ...node[relationshipKey].some(node => node.nodeId === nextNodeMerged.nodeId) ? [] : [nextNodeMerged]] 
                    : [nextNodeMerged]
                buildTree(nextNodeMerged as any, pathIndex.replace('p', 'n') as `n_${string}`)
            })
            return node
        }
        return buildTree(rootNode as any, rootStringIndex)
    })
    return Ok(result as Subgraph extends NodeShape<NodeDefinitionMap[NodeType]>
        ? Subgraph
        : NodeShapeTree<NodeDefinitionMap, NodeType, Subgraph>
    )
})

export type NodeShapeTree<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    NodeType extends keyof NodeDefinitionMap,
    Subgraph extends {nodeType: NodeType} & Record<string, any>,
> = NodeShape<NodeDefinitionMap[NodeType]> & {
    [Relationship in keyof Subgraph as Exclude<Relationship, keyof NodeShape<NodeDefinitionMap[Subgraph['nodeType']]>>]: (
        Relationship extends `-${infer RelationshipType}->${infer RelatedNodeType}`
            ? NodeDefinitionMap[Subgraph['nodeType']]['relationshipDefinitionSet'][number] extends (infer RelationshipUnionRef extends AnyRelationshipDefinition | never)
                ? AnyRelationshipDefinition extends RelationshipUnionRef
                    ? (RelationshipUnionRef&{type: RelationshipType})['cardinality'] extends `${string}-many`
                        ? (RelationshipState<RelationshipUnionRef&{type: RelationshipType}> & NodeShapeTree<NodeDefinitionMap, RelatedNodeType, Subgraph[Relationship][number]>)[]
                        : RelationshipState<RelationshipUnionRef&{type: RelationshipType}> & NodeShapeTree<NodeDefinitionMap, RelatedNodeType, Subgraph[Relationship]>
                    : unknown
                : unknown
            : Relationship extends `<-${infer RelationshipType}-${infer RelatedNodeType}`
                ? NodeDefinitionMap[RelatedNodeType]['relationshipDefinitionSet'][number] extends (infer RelationshipUnionRef extends AnyRelationshipDefinition | never)
                    ? AnyRelationshipDefinition extends RelationshipUnionRef
                        ? (RelationshipUnionRef&{type: RelationshipType})['cardinality'] extends `many-${string}`
                            ? (RelationshipState<RelationshipUnionRef&{type: RelationshipType}> & NodeShapeTree<NodeDefinitionMap, RelatedNodeType, Subgraph[Relationship][number]>)[]
                            : RelationshipState<RelationshipUnionRef&{type: RelationshipType}> & NodeShapeTree<NodeDefinitionMap, RelatedNodeType, Subgraph[Relationship]>
                        : unknown
                    : unknown
                : unknown
        )
}

