import dedent from "dedent"
import { neo4jAction, neo4jDriver } from "../clients/neo4j"
import { AnyNodeDefinitionMap, GenericNodeShape, NodeShape, NodeState } from "../definitions/NodeDefinition"
import { Ok } from "../types/Result"
import { v4 as uuid } from 'uuid'
import {  GenericRelationshipDefinition, GenericRelationshipShape } from "../definitions/RelationshipDefinition"
import { EagerResult, Integer, Node, Path, Relationship } from "neo4j-driver"
import { AnyZodObject, z } from "zod"
import { removeRelationshipEntries } from "../utilities/removeRelationshipEntries"
import { getRelationshipEntries } from "../utilities/getRelationshipEntries"
import { MergeInputTree } from "../types/MergeInputTree"
import { MergeOutputTree } from "../types/MergeOutputTree"


export const mergeSubgraphFactory = <
    NodeDefinitionMap extends AnyNodeDefinitionMap,
>(
    nodeDefinitionMap: NodeDefinitionMap
) => neo4jAction(async <
    NodeType extends keyof NodeDefinitionMap,
    InputTree extends MergeInputTree<NodeDefinitionMap, NodeType>
>(subgraph: (
    ({
        nodeType: NodeType
    }) & InputTree
)) => {
    const subgraphRef = subgraph
    // Flatten Tree 
    // Create Index Set
    const rootVariable = `n_t0_i0`
    let variableList = [rootVariable]
    let variableStateEntries = [
        [`${rootVariable}_state`, removeRelationshipEntries(subgraphRef!)],
    ]
    console.log("MERGE INPUT", JSON.stringify(subgraphRef, null, 2))
    let queryString = dedent/*cypher*/`
        ${(() => {
            if (subgraphRef.delete) {
                return dedent/*cypher*/`
                    // Handle Deletion
                    match (${rootVariable}:${(subgraphRef).nodeType} { 
                        ${(nodeDefinitionMap[subgraph.nodeType]!).uniqueIndexes
                            .filter((index:string) => !!subgraph[index])
                            .map((index: any) => `${index}: "${subgraph[index]}"`).join(', ')
                        }
                    })
                    detach delete ${rootVariable}
                `
            }
            return dedent/*cypher*/`
                merge (${rootVariable}:${(subgraphRef).nodeType} { 
                    ${(nodeDefinitionMap[subgraph.nodeType]!).uniqueIndexes
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
                        ${rootVariable}.updatedAt = timestamp()
            `
        })()}
        \n
    `
    type RelationshipKey = `<-${string}-${string}-${string}` | `${string}-${string}->${string}`
    type RelatedNodeTree = (GenericNodeShape&{delete?: boolean, detach?:boolean}) & {[id:string]: RelatedNodeTree}
    const subgraphToQueryString = (relationshipKey: RelationshipKey, relatedNode: RelatedNodeTree, path: string, previousNodeType: string) => {
        const pathSegments = path.split('_')
        const relationshipString = relationshipKey[0] === '<'
        ? `<-[r_${path}:${relationshipKey.split('-')[1]}]-`
        : `-[r_${path}:${relationshipKey.split('-')[1]}]->`
        const relationshipType = relationshipKey.split('-')[1]
        const nextNodeType = relatedNode?.nodeType??pathSegments[2]!.replaceAll('>', '')
        const nextNodeIndexes = nodeDefinitionMap[nextNodeType]!.uniqueIndexes
            .filter((index:string) => !!relatedNode[index]).length > 1
            ? nodeDefinitionMap[nextNodeType]!.uniqueIndexes
                .filter((index:string) => !!relatedNode[index] && index !== 'nodeId')
                .map((index: any) => `${index}: "${relatedNode[index]}"`).join(', ')
            : nodeDefinitionMap[nextNodeType]!.uniqueIndexes
                .filter((index:string) => !!relatedNode[index])
                .map((index: any) => `${index}: "${relatedNode[index]}"`).join(', ')

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
                set n_${path} += apoc.map.removeKey($n_${path}_state, 'nodeId'),
                    n_${path}:Node,
                    n_${path}.updatedAt = timestamp()

            // Handle Relationship
            
            ${(() => {
                if (relatedNode.detach) {
                    return dedent/*cypher*/`
                        with *
                        match (n_${pathSegments.slice(0, pathSegments.length-2).join('_')})
                        ${relationshipString}
                        (n_${path})
                        delete r_${path}
                    `
                }
                if (relatedNode.delete) {
                    return dedent/*cypher*/`
                        with *
                        match (n_${path})
                        detach delete n_${path}
                    `
                }
                return dedent/*cypher*/`
                    merge p_${path}=(n_${pathSegments.slice(0, pathSegments.length-2).join('_')})
                    ${relationshipString}
                    (n_${path})
                    on create
                        set r_${path}.relationshipType = "${relationshipType}",
                            r_${path} += $r_${path}_state,
                            r_${path}.strength = "${                 
                                nodeDefinitionMap[relationshipKey.includes('<') ? nextNodeType : previousNodeType]!
                                .relationshipDefinitionSet.find(
                                    (relationship: GenericRelationshipDefinition) => relationship.type === relationshipType
                                ).strength
                            }"
                    on match
                        set r_${path} += $r_${path}_state,
                            r_${path}.strength = "${                 
                                nodeDefinitionMap[relationshipKey.includes('<') ? nextNodeType : previousNodeType]!
                                .relationshipDefinitionSet.find(
                                    (relationship: GenericRelationshipDefinition) => relationship.type === relationshipType
                                ).strength
                            }"
                `
            })()}
            \n
        `;
        !(relatedNode.delete || relatedNode.detach) && variableList.push(`p_${path}`, `r_${path}`, `n_${path}`)
        const nodeSchema = 'options' in nodeDefinitionMap[nextNodeType]!.stateSchema
            ? z.discriminatedUnion(
                nodeDefinitionMap[nextNodeType]!.stateSchema.discriminator, 
                nodeDefinitionMap[nextNodeType]!.stateSchema.options.map((option: AnyZodObject) => option.extend({nodeId: z.string()}))
            )
            : nodeDefinitionMap[nextNodeType]!.stateSchema.extend({nodeId: z.string()})
        const relationshipSchema = relationshipString.includes('<') 
            ? nodeDefinitionMap[nextNodeType]!.relationshipDefinitionSet.find((relationship: GenericRelationshipDefinition) => relationship.type === relationshipType).stateSchema
            : nodeDefinitionMap[previousNodeType]!.relationshipDefinitionSet.find((relationship: GenericRelationshipDefinition) => relationship.type === relationshipType).stateSchema
        variableStateEntries.push(
            [`n_${path}_state`, nodeSchema.parse(removeRelationshipEntries(relatedNode))],
            relationshipSchema ? [`r_${path}_state`, relationshipSchema.parse(removeRelationshipEntries(relatedNode))] : [`r_${path}_state`, {}],
        )
        treeToQueryString(relatedNode, `${path}`)
    }
    
    const treeToQueryString = (subgraph: RelatedNodeTree, path: string) => {
        getRelationshipEntries(subgraph).forEach(([key], t_idx) => {
            const pathSegments = path.split('_')
            const nextNodeType = key.split('-')[2]!.replace('>', '') ?? pathSegments[2]!.replaceAll('>', '')
            const related = subgraph[key as keyof typeof subgraph] as RelatedNodeTree
            Object.entries(related).forEach(([nodeId, node], i_idx) => {
                subgraphToQueryString(key as RelationshipKey, {
                    ...(<any>node),
                    nodeType: nextNodeType,
                    nodeId: (<GenericNodeShape>node).nodeId ?? uuid(),
                }, `${path}_t${t_idx}_i${i_idx}`, subgraph.nodeType)
            })
        })
    }
    (subgraphRef.delete) || treeToQueryString(subgraphRef as any, `t0_i0`)
    // Add Return Statement
    if (!subgraphRef.delete){
        queryString += dedent/*cypher*/`
            return ${variableList.join(', ')}
        `
    }
    console.log("QUERY STRING", queryString)
    // writeFileSync('tests/merge:queryString.cypher', queryString)
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
        // writeFileSync('tests/merge:records.json', JSON.stringify(result.records, null, 2))
        if(subgraphRef.delete ) return Ok(removeRelationshipEntries(subgraphRef))
        const entityMap = result.records[0]!
        const rootNode = result.records[0]!.get(rootVariable).properties
        const rootStringIndex = rootVariable 
        const buildTree = (
            node: GenericNodeShape & {
                [r:string]: {
                    [id: string]: GenericNodeShape
                }
            },     
            nodeIndex: `n_${string}`
        ) => {
            const pathIndexSet = variableList.filter(variable => 
                variable.startsWith(nodeIndex.replace('n', 'p')) 
                && nodeIndex.split('_').length === variable.split('_').length - 2
            ) as `p_${string}`[]
            pathIndexSet.forEach(pathIndex => {
                const path = entityMap.get(pathIndex).segments[0]!
                const relationship = path.relationship as Relationship<Integer, GenericRelationshipShape>
                const rightEndcap = relationship.start === path.start.identity  ? '->' : '-'
                const leftEndcap = relationship.start === path.end.identity ? '<-' : '-'
                const nextNode = path.end.properties as GenericNodeShape
                const relationshipKey = `${leftEndcap}${relationship.type}${rightEndcap}${nextNode.nodeType}`
                const nextNodeMerged = {
                    fromNodeId: node.nodeId,
                    fromNodeType: node.nodeType,
                    ...relationship.properties,
                    ...nextNode,
                }
                node[relationshipKey] = node[relationshipKey] 
                    ? {
                        ...node[relationshipKey],
                        [nextNodeMerged.nodeId]: nextNodeMerged
                    }
                    :{
                        [nextNodeMerged.nodeId]: nextNodeMerged
                    }
                buildTree(nextNodeMerged as any, pathIndex.replace('p', 'n') as `n_${string}`)
            })
            return node
        }
        return buildTree(rootNode as any, rootStringIndex)
    })
    if (process.env.TEST_ENV === "true") {
        const fs = require('fs')
        fs.writeFileSync('tests/merge:queryString.cypher', queryString)
        fs.writeFileSync('tests/merge:resultTree.json', JSON.stringify(result, null, 2))
    }
    console.log("MERGE RESULT", result)
    return Ok(result as MergeOutputTree<NodeDefinitionMap, NodeType, InputTree>)
})

