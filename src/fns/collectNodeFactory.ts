import { EagerResult, Integer, Node } from "neo4j-driver"
import { neo4jAction, neo4jDriver } from "../clients/neo4j"
import { AnyNodeDefinitionMap } from "../definitions/NodeDefinition"
import { Ok } from "../types/Result"
import { CollectOptions, RelationshipCollectionMap } from "../types/RelationshipCollectionMap"
import dedent from "dedent"
import path from "path"
import { CardinalityTypeSet, StrengthTypeSet } from "../definitions/RelationshipDefinition"


type NodeRelation = ({
    direction: 'to' | 'from';
    nodeType: string;
    options?: { limit: number };
}) | (({
    [relationshipType: string]: NodeRelation;
}))

type RecordIndex = `n_${number}_${number}` | `r_${number}_${number}`
type UixDataNodeRecord = {
    nodeId: string
    nodeType: string
}
type RelationshipRecord = {
    cardinality: CardinalityTypeSet
    strength: StrengthTypeSet
    relationshipType: string
}
type EagerCollectionResult = EagerResult<{
    [Key: `n_${number}_${number}` | `r_${number}_${number}`]: Node<Integer, UixDataNodeRecord | RelationshipRecord>
}>
type NextUixDataNode = ({
    [relationshipType: string]: UixDataNode
})
type UixDataNode = UixDataNodeRecord | NextUixDataNode
class TypedRecord {
    constructor(
        public record: EagerCollectionResult['records'][number]
    ){}
    get<T extends RecordIndex>(recordIndex: T) {
        return this.record.get(recordIndex).properties as T extends `n_${number}_${number}` 
            ? UixDataNodeRecord
            : RelationshipRecord
    }
    has<T extends RecordIndex>(recordIndex: T) {
        return this.record.has(recordIndex)
    }
    keys() {
        return this.record.keys
    }
}

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
        options?: CollectOptions
    }) | ({
        referenceType: 'nodeIndex'
        indexKey: NodeTypeMap[NodeType]['uniqueIndexes'][number]
        indexValue: string
    })
) & (unknown extends RelationshipCollectionMap<NodeTypeMap, NodeType>
    ? unknown 
    : RelationshipCollectionMap<NodeTypeMap, NodeType>)
) => {
    let queryString = dedent/*cypher*/`
        match (n_0_0:${params.nodeType} {${params.indexKey}: "${params.indexValue}"})
        ${'options' in params && params.options && 'limit' in params.options
            ? dedent/*cypher*/`
                with n_0_0
                limit ${params.options.limit}
            `
            : ''
        }
    `
    let variableList = ['n_0_0']
    const relationshipKeys = Object.keys(params).filter((key) => !['referenceType', 'nodeType', 'indexKey', 'indexValue'].includes(key))
    const createPath = (relationshipType: string, nodeRelation: NodeRelation, dimension: number, depth: number) => {
        const newVariables = [`n_${dimension}_${depth}`, `r_${dimension}_${depth}`]
        variableList.push(...newVariables)
        queryString += dedent/*cypher*/`\n
            call {
                with n_${(dimension > 0 && depth === 1) ? 0 : dimension}_${depth - 1}
                match (n_${(dimension > 0 && depth === 1) ? 0 : dimension}_${depth - 1})${nodeRelation.direction === 'from' ? '<' : ''}-[r_${dimension}_${depth}:${relationshipType}]-${nodeRelation.direction === 'to' ? '>' : ''}(n_${dimension}_${depth}:${nodeRelation.nodeType})
                ${'options' in nodeRelation && nodeRelation.options && 'limit' in nodeRelation.options
                ? dedent/*cypher*/`
                    return ${newVariables.join(', ')}
                    limit ${nodeRelation.options.limit}
                ` : ''
            }
            }
            
        `
        const relationshipKeys = Object.keys(nodeRelation).filter((key) => !['direction', 'nodeType', 'options'].includes(key))
        relationshipKeys.forEach((key, idx) => {
            createPath(key, nodeRelation[key as keyof typeof nodeRelation] as NodeRelation, idx, depth + 1)
        })
    }
    relationshipKeys.forEach((key, idx) => params[key as keyof typeof params] && createPath(key, params[key as keyof typeof params] as NodeRelation, idx, 1))
    queryString += dedent/*cypher*/`\n
        return ${variableList.join(', ')}
    `
    console.log(queryString)
    const collection = await neo4jDriver().executeQuery<EagerCollectionResult>(queryString, {
        indexValue: 'indexValue' in params ? params.indexValue : undefined
    })
    .then((result) => {
        const nodeMap = new TypedRecord(result.records[0]);
        return Array.from({ length: ((nodeMap.keys().length-1)/2)+1 }, (_, index) => index).reduce((acc, idx,_, arr) => {
            if (!acc.rootNode) {
                acc.rootNode = nodeMap.get(`n_0_0`)
                acc.currentNode = acc.rootNode
                acc.depthIdx = 1
                return acc
            }
            if (!nodeMap.has(`n_${acc.pathIdx}_${acc.depthIdx}`)) {
                // New Path Started
                acc.pathIdx += 1
                acc.depthIdx = 1;
                (<NextUixDataNode>acc.rootNode)[
                    nodeMap.get(`r_${acc.pathIdx}_${acc.depthIdx}`).relationshipType
                ] = nodeMap.get(`n_${acc.pathIdx}_${acc.depthIdx}`)
                acc.currentNode = (<NextUixDataNode>acc.rootNode)[
                    nodeMap.get(`r_${acc.pathIdx}_${acc.depthIdx}`).relationshipType
                ]
                acc.depthIdx += 1
                return acc
            }
            // Path Continuation
            (<NextUixDataNode>acc.currentNode)[
                nodeMap.get(`r_${acc.pathIdx}_${acc.depthIdx}`).relationshipType
            ] = nodeMap.get(`n_${acc.pathIdx}_${acc.depthIdx}`)
            acc.currentNode = (<NextUixDataNode>acc.currentNode)[
                nodeMap.get(`r_${acc.pathIdx}_${acc.depthIdx}`).relationshipType
            ]
            acc.depthIdx += 1
            return acc
        }, {
            pathIdx: 0,
            depthIdx: 0,
        } as {
            pathIdx: number
            depthIdx: number
            rootNode: UixDataNode
            currentNode: UixDataNode
        })
    })

    return Ok(collection as any)
})