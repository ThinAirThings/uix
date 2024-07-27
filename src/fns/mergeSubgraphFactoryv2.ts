import dedent from "dedent"
import { neo4jAction, neo4jDriver } from "../clients/neo4j"
import { AnyNodeDefinitionMap, GenericNodeShape, NodeShape, NodeState } from "../definitions/NodeDefinition"
import { Ok } from "../types/Result"
import { v4 as uuid } from 'uuid'
import {  GenericRelationshipDefinition, GenericRelationshipShape, RelationshipState } from "../definitions/RelationshipDefinition"
import { GenericNodeKey, NodeKey } from "../types/NodeKey"
import { AnySubgraphSpecification, SubgraphSpecification } from "../types/SubgraphSpecification"
import { RootSubgraphSpecificationNode } from "../types/SubgraphSpecificationNode"
import { SubgraphTree } from "../types/SubgraphTypeFunctions"
import { Draft, produce } from "immer"
import { EagerResult, Integer, Node, Path, Relationship } from "neo4j-driver"


type RecordIndex = `n_${number}_${number}` | `r_${number}_${number}`

export const mergeSubgraphFactoryv2 = <
    NodeDefinitionMap extends AnyNodeDefinitionMap,
>(
    nodeDefinitionMap: NodeDefinitionMap
) => neo4jAction(async <
    NodeType extends keyof NodeDefinitionMap,
    SubgraphSpecificationRef extends AnySubgraphSpecification | undefined,
    Subgraph extends SubgraphSpecificationRef extends AnySubgraphSpecification 
        ? NodeShape<NodeDefinitionMap[NodeType]> & (SubgraphSpecificationRef extends AnySubgraphSpecification 
            ? SubgraphTree<NodeDefinitionMap, SubgraphSpecificationRef>
            : unknown)
        : {nodeType: NodeType, nodeId?: string},
>(params: (
    ({
        nodeType: NodeType
    }) & (({
        operation: 'update',
        subgraph: Subgraph,
        updater: (draft: Draft<Subgraph>) => void
    }) | ({
        operation: 'create',
        state: NodeState<NodeDefinitionMap[NodeType]> & (SubgraphSpecificationRef extends AnySubgraphSpecification 
            ? SubgraphTree<NodeDefinitionMap, SubgraphSpecificationRef>
            : unknown
        ),
    })) & ({
        subgraphSpec?: (subgraph: SubgraphSpecification<NodeDefinitionMap, `n_0_0`, readonly [
            RootSubgraphSpecificationNode<NodeDefinitionMap, NodeType>
        ]>) => SubgraphSpecificationRef
    }))
) => {
    const removeRelationshipEntries = (subgraph: object) => Object.fromEntries(Object.entries(subgraph).filter(([key]) => !(key.includes('->') || key.includes('<-'))))
    const getRelationshipEntries = (subgraph: object) => Object.entries(subgraph).filter(([key]) => key.includes('->') || key.includes('<-'))
    console.log(JSON.stringify(params, null, 2))
    const subgraphRef = (params.operation === 'update' ? produce(params.subgraph, params.updater) : {
        nodeType: params.nodeType,
        ...params.state
    })
    // Flatten Tree 
    // Create Index Set
    const rootVariable = `n_t0_i0`
    let variableList = [rootVariable]
    let variableStateEntries = [[`${rootVariable}_state`, removeRelationshipEntries(subgraphRef!)]]
    let queryString = dedent/*cypher*/`
        merge (${rootVariable}:${(subgraphRef as GenericNodeKey).nodeType} { nodeId: "${(subgraphRef as GenericNodeKey).nodeId ? (subgraphRef as GenericNodeKey).nodeId : uuid()}"})
        on create 
            set ${rootVariable} += $${rootVariable}_state,
                ${rootVariable}:Node,
                ${rootVariable}.createdAt = timestamp(),
                ${rootVariable}.updatedAt = timestamp()
        on match
            set ${rootVariable} += $${rootVariable}_state,
                ${rootVariable}:Node,
                ${rootVariable}.updatedAt = timestamp() \n
    `
    type RelationshipKey = `<-${string}-${string}-${string}` | `${string}-${string}->${string}`
    const relationToQueryString = (relationshipKey: RelationshipKey, relation: any, path: string, previousNodeType: string) => {
        const pathSegments = path.split('_')
        const relationshipString = relationshipKey[0] === '<'
        ? `<-[r_${path}:${relationshipKey.split('-')[1]}]-`
        : `-[r_${path}:${relationshipKey.split('-')[1]}]->`
        const relationshipType = relationshipKey.split('-')[1]
        queryString += dedent/*cypher*/`
            merge p_${path}=(n_${pathSegments.slice(0, pathSegments.length-2).join('_')})${relationshipString}(n_${path}:${relation?.nodeType??pathSegments[2].replaceAll('>', '')} { nodeId: "${relation.nodeId ? relation.nodeId : uuid()}"})
            on create
                set n_${path} += $n_${path}_state,
                    n_${path}.nodeType = "${relation?.nodeType??pathSegments[2].replaceAll('>', '')}",
                    n_${path}:Node,
                    n_${path}.createdAt = timestamp(),
                    n_${path}.updatedAt = timestamp(),
                    r_${path}.relationshipType = "${relationshipType}",
                    r_${path} += $r_${path}_state
            on match
                set n_${path} += $n_${path}_state,
                    n_${path}:Node,
                    n_${path}.updatedAt = timestamp(),
                    r_${path} += $r_${path}_state \n 
        `
        variableList.push(`p_${path}`, `r_${path}`, `n_${path}`)
        const relationshipSchema = relationshipString.includes('<') 
            ? nodeDefinitionMap[relation.nodeType].relationshipDefinitionSet.find((relationship: GenericRelationshipDefinition) => relationship.type === relationshipType).stateSchema
            : nodeDefinitionMap[previousNodeType].relationshipDefinitionSet.find((relationship: GenericRelationshipDefinition) => relationship.type === relationshipType).stateSchema
        variableStateEntries.push(
            [`n_${path}_state`, nodeDefinitionMap[relation.nodeType].stateSchema.parse(removeRelationshipEntries(relation))],
            relationshipSchema ? [`r_${path}_state`, relationshipSchema.parse(removeRelationshipEntries(relation))] : [`r_${path}_state`, {}]
        )
        treeToQueryString(relation, `${path}`)
    }
    const treeToQueryString = (subgraph: any, path: string) => {
        getRelationshipEntries(subgraph).forEach(([key], t_idx) => {
            if (!(key.includes('<-') || key.includes('->'))) return
            const nodeType = key.split('-')[2].replace('>', '')
            const related = subgraph[key as keyof typeof subgraph]
            if (Array.isArray(related)) {
                related.forEach((node, i_idx) => {
                    relationToQueryString(key as RelationshipKey, {nodeType, ...node}, `${path}_t${t_idx}_i${i_idx}`, subgraph.nodeType)
                })
            } else {
                relationToQueryString(key as RelationshipKey, {nodeType, ...related} as any, `${path}_t${t_idx}_i0`, subgraph.nodeType)
            }
        })
    }
    treeToQueryString(subgraphRef as any, `t0_i0`)
    // Add Return Statement
    queryString += dedent/*cypher*/`
        return ${variableList.join(', ')}
    `
    console.log(queryString)
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
                node[relationshipKey] = node[relationshipKey] ? [...node[relationshipKey], nextNodeMerged] : [nextNodeMerged]
                buildTree(nextNodeMerged as any, pathIndex.replace('p', 'n') as `n_${string}`)
            })
            return node
        }
        return buildTree(rootNode as any, rootStringIndex)
    })
    return Ok(result as Subgraph)
})