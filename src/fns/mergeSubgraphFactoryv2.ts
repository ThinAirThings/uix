import dedent from "dedent"
import { neo4jAction, neo4jDriver } from "../clients/neo4j"
import { AnyNodeDefinitionMap, NodeShape, NodeState } from "../definitions/NodeDefinition"
import { Ok } from "../types/Result"
import { v4 as uuid } from 'uuid'
import { RelationshipUnion } from "../types/RelationshipUnion"
import { AnyRelationshipDefinition, GenericRelationshipDefinition, RelationshipState } from "../definitions/RelationshipDefinition"
import { GenericNodeKey, NodeKey } from "../types/NodeKey"
import { AnySubgraphSpecification, StartingSubgraphSpecification, SubgraphSpecification } from "../types/SubgraphSpecification"
import { RootSubgraphSpecificationNode } from "../types/SubgrapSpecificationNode"
import { SubgraphTree } from "../types/SubgraphTypeFunctions"
import { Draft, produce } from "immer"
import { z } from "zod"
import { AnyExtractionSubgraph, ExtractionSubgraph } from "../types/ExtractionSubgraph"
import { RootExtractionNode } from "../types/ExtractionNode"


type RecordIndex = `n_${number}_${number}` | `r_${number}_${number}`


// type MergeSubgraphPath<
//     NodeDefinitionMap extends AnyNodeDefinitionMap,
//     NodeType extends keyof NodeDefinitionMap
// > = Omit<NodeShape<NodeDefinitionMap[NodeType]>, 'nodeId'|'createdAt'|'updatedAt'> & ({
//     [Relationship in RelationshipUnion<NodeDefinitionMap, NodeType>]?: 
//         Relationship extends `-${infer RelationshipType}->${infer NextNodeType}`
//             ? NodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number] extends (infer RelationshipUnionRef extends AnyRelationshipDefinition | never)
//                 ? AnyRelationshipDefinition extends RelationshipUnionRef
//                     ? (RelationshipUnionRef & {type: RelationshipType})['cardinality'] extends `${string}-to-many`
//                         ? (
//                             NodeState<NodeDefinitionMap[NextNodeType]> 
//                             & RelationshipState<(NodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number] & {type: RelationshipType})>
//                             & {nodeType: NextNodeType, nodeId?: string} 
//                             & MergeSubgraphPath<NodeDefinitionMap, NextNodeType>
//                         )[]
//                         : (
//                             NodeState<NodeDefinitionMap[NextNodeType]> 
//                             & RelationshipState<NodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number] & {type: RelationshipType}>
//                             & {nodeType: NextNodeType, nodeId?: string} 
//                             & MergeSubgraphPath<NodeDefinitionMap, NextNodeType>
//                         )
//                     : never
//                 : never
//         : Relationship extends `<-${infer RelationshipType}-${infer NextNodeType}`
//             ? NodeDefinitionMap[NextNodeType]['relationshipDefinitionSet'][number] extends (infer RelationshipUnionRef extends AnyRelationshipDefinition | never) 
//                 ? AnyRelationshipDefinition extends RelationshipUnionRef
//                     ? (RelationshipUnionRef & {type: RelationshipType})['cardinality'] extends `many-to-${string}`
//                         ? (
//                             NodeState<NodeDefinitionMap[NextNodeType]> 
//                             & RelationshipState<NodeDefinitionMap[NextNodeType]['relationshipDefinitionSet'][number] & {type: RelationshipType}>
//                             & {nodeType: NextNodeType, nodeId?: string} 
//                             & MergeSubgraphPath<NodeDefinitionMap, NextNodeType>
//                         )[]
//                         : (
//                             NodeState<NodeDefinitionMap[NextNodeType]> 
//                             & RelationshipState<NodeDefinitionMap[NextNodeType]['relationshipDefinitionSet'][number] & {type: RelationshipType}>
//                             & {nodeType: NextNodeType, nodeId?: string} 
//                             & MergeSubgraphPath<NodeDefinitionMap, NextNodeType>
//                         )
//                     : never
//                 : never
//             : never
// })
// // 
// type AnyMergeSubgraphPath = MergeSubgraphPath<any, any>
// (NodeState<NodeDefinitionMap[NodeType]> & SubgraphTree<NodeDefinitionMap, Subgraph>)
export const mergeSubgraphFactoryv2 = <
    NodeDefinitionMap extends AnyNodeDefinitionMap,
>(
    nodeDefinitionMap: NodeDefinitionMap
) => neo4jAction(async <
    NodeType extends keyof NodeDefinitionMap,
    SubgraphSpecificationRef extends AnySubgraphSpecification | undefined,
    Subgraph extends SubgraphSpecificationRef extends AnySubgraphSpecification 
        ? NodeState<NodeDefinitionMap[NodeType]> & (SubgraphSpecificationRef extends AnySubgraphSpecification 
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
    const subgraphRef = (params.operation === 'update' ? produce(params.subgraph, params.updater) : params.state)
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
    //@ts-ignore
    const relationToQueryString = (relationshipKey: RelationshipKey, relation: AnyMergeSubgraphPath, path: string, previousNodeType: string) => {
        const pathSegments = path.split('_')
        const relationshipString = relationshipKey[0] === '<'
        ? `<-[r_${path}:${relationshipKey.split('-')[1]}]-`
        : `-[r_${path}:${relationshipKey.split('-')[1]}]->`
        const relationshipType = relationshipKey.split('-')[1]
        queryString += dedent/*cypher*/`
            merge (n_${pathSegments.slice(0, pathSegments.length-2).join('_')})${relationshipString}(n_${path}:${relation?.nodeType??pathSegments[2].replaceAll('>', '')} { nodeId: "${relation.nodeId ? relation.nodeId : uuid()}"})
            on create
                set n_${path} += $n_${path}_state,
                    n_${path}:Node,
                    n_${path}.createdAt = timestamp(),
                    n_${path}.updatedAt = timestamp(),
                    r_${path} += $r_${path}_state
            on match
                set n_${path} += $n_${path}_state,
                    n_${path}:Node,
                    n_${path}.updatedAt = timestamp(),
                    r_${path} += $r_${path}_state \n 
        `
        variableList.push(`n_${path}`, `r_${path}`)
        console.log("Relation", JSON.stringify(removeRelationshipEntries(relation)))
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
            const related = subgraph[key as keyof typeof subgraph]
            if (Array.isArray(related)) {
                related.forEach((node, i_idx) => {
                    relationToQueryString(key as RelationshipKey, node, `${path}_t${t_idx}_i${i_idx}`, subgraph.nodeType)
                })
            } else {
                relationToQueryString(key as RelationshipKey, related as any, `${path}_t${t_idx}_i0`, subgraph.nodeType)
            }
        })
    }
    treeToQueryString(subgraphRef as any, 't0_i0')
    // Add Return Statement
    queryString += dedent/*cypher*/`
        return ${variableList.join(', ')}
    `
    const result = await neo4jDriver().executeQuery(
        queryString, 
        Object.fromEntries(variableStateEntries)
    )
    .then(result => [...result.records[0]?.entries()].reduce((acc, [key, data]) => {
        acc[key] = data.properties
        return acc
    }, {} as any))
    return Ok(result as Subgraph)
})