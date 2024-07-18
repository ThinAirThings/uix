import { EagerResult } from "neo4j-driver"
import { neo4jAction, neo4jDriver } from "../clients/neo4j"
import { AnyNodeDefinitionMap } from "../definitions/NodeDefinition"
import { NodeKey } from "../types/NodeKey"
import { Ok } from "../types/Result"
import { RelationshipCollectionMap } from "../types/RelationshipCollectionMap"
import dedent from "dedent"
import { createCollectionSequence, GenericCollectionMapEntry } from "../utilities/createCollectionSequence"





export const collectNodeFactory = <
    NodeTypeMap extends AnyNodeDefinitionMap,
>(
    nodeTypeMap: NodeTypeMap
) => neo4jAction(async <
    NodeType extends keyof NodeTypeMap,
>(params: ({
    nodeType: NodeType 
}) & (
    ({
        referenceType: 'nodeType'
    }) | ({
        referenceType: 'nodeIndex'
        indexKey: NodeTypeMap[NodeType]['uniqueIndexes'][number]
        indexValue: string
    })
) & ({
    relatedBy?: RelationshipCollectionMap<NodeTypeMap, NodeType>
})
) => {
    const sequence = params.relatedBy ? createCollectionSequence({
        relatedBy: params.relatedBy as GenericCollectionMapEntry,
        sequence: [],
    }).reverse() : null
    const collection = await neo4jDriver().executeQuery<EagerResult<{
        tree: any // YOU ARE HERE!!!
    }>>(dedent/*cypher*/`
        match (referenceNode:${params.nodeType} ${params.referenceType === 'nodeIndex' ?/*cypher*/`{${params.indexKey}: $indexValue}`: ''})
        ${sequence 
        ? /*cypher*/`call apoc.path.expandConfig(referenceNode, {
            sequence: "${`+${params.nodeType as string}`},${sequence.map(
                ({relationshipType, node}) => `${relationshipType.join('|')},${node.map(({nodeType}) => nodeType).join('|')}`).join(',')
            }"
        }) yield path
        with collect(path) as paths
        call apoc.convert.toTree(paths, false) yield value as tree
        return tree
        `: ''}
    `, {
        indexValue: 'indexValue' in params ? params.indexValue : undefined
    })
    return Ok(collection)
})