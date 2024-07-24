import { EagerResult, Integer, Node, Relationship } from "neo4j-driver"
import { neo4jAction, neo4jDriver } from "../clients/neo4j"
import { AnyNodeDefinitionMap, NodeShape } from "../definitions/NodeDefinition"
import { Ok } from "../types/Result"
import { CollectOptions, RelationshipCollectionMap } from "../types/RelationshipCollectionMap"
import dedent from "dedent"
import path from "path"
import { CardinalityTypeSet, StrengthTypeSet } from "../definitions/RelationshipDefinition"
import { open, writeFile } from "fs/promises"
import { QueryPathNode, RootQueryPathNode } from "../types/QueryPathNodev2"


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
    direction: 'from' | 'to'
    cardinality: CardinalityTypeSet
    strength: StrengthTypeSet
    relationshipType: string
}
type EagerCollectionResult = EagerResult<{
    [Key: `n_${number}_${number}`]: Node<Integer, UixDataNodeRecord>
} & {
    [Key: `r_${number}_${number}`]: Relationship<Integer, RelationshipRecord>
}>
type NodeMapEntry = [string, UixDataNode]
type NextUixDataNode = ({
    [relationshipType: string]: UixDataNode | NodeMapEntry[]
})
type UixDataNode = UixDataNodeRecord | NextUixDataNode
class TypedRecord {
    constructor(
        public record: EagerCollectionResult['records'][number]
    ) { }
    get<T extends RecordIndex>(recordIndex: T) {
        const record = this.record.get(recordIndex)
        return (('start' in record && 'end' in record) ? {
            ...record.properties,
            direction: record.start > record.end ? 'from' : 'to',
        } : record.properties) as T extends `n_${number}_${number}`
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

const isManyRelationship = (relationship: RelationshipRecord) =>
    ((relationship.direction === 'from' && relationship.cardinality.split('-')[0] === 'many') || (relationship.direction === 'to' && relationship.cardinality.split('-')[2] === 'many'))


type NodeAccumulator = {
    pathIdx: number
    depthIdx: number
    rootDepth: UixDataNode | NodeMapEntry[]
    nextDepth: UixDataNode | NodeMapEntry[]
}

export const collectNodeFactoryv2 = <
    NodeTypeMap extends AnyNodeDefinitionMap,
>(
    nodeTypeMap: NodeTypeMap
) => neo4jAction(async <
    NodeType extends keyof NodeTypeMap,
    ReferenceType extends 'nodeType' | 'nodeIndex',
    QueryPath extends QueryPathNode<NodeTypeMap, NodeType, any, any, any, any>,
>(params: ({
    nodeType: NodeType
}) & (
        ReferenceType extends 'nodeType'
        ? ({
            referenceType: ReferenceType
            options?: CollectOptions
        }) : ({
            referenceType: ReferenceType
            indexKey: NodeTypeMap[NodeType]['uniqueIndexes'][number]
            indexValue: string
        })
    ) & ({
        queryPath: (rootQueryPathNode: RootQueryPathNode<NodeTypeMap, NodeType>) => QueryPath
    })
) => {
    let queryString = dedent/*cypher*/`
        match (n_0_0:${params.nodeType} ${params.referenceType === 'nodeIndex' ? /*cypher*/`{${params.indexKey}: "${params.indexValue}"}` : ''})
        ${'options' in params && params.options && 'limit' in params.options
            ? dedent/*cypher*/`
                with n_0_0
                limit ${params.options.limit}
            `
            : ''
        }
    `
    let variableList = ['n_0_0']
    const queryPath = params.queryPath(new RootQueryPathNode(nodeTypeMap, params.nodeType)).root.getQueryTree()
    console.log("Query Path", JSON.stringify(queryPath, null, 2))
    // const relationshipKeys = Object.keys(params).filter((key) => !['referenceType', 'nodeType', 'indexKey', 'indexValue'].includes(key))
    const relationshipKeys = Object.keys(queryPath)
        .filter((key) => !['direction', 'nodeType', 'options'].includes(key))
        .map((key) => [key.split('-')[1], key])
    console.log("Relationship Keys", relationshipKeys)
    const createPath = (relationshipType: string, nodeRelation: NodeRelation, dimension: number, depth: number) => {
        const newVariables = [`r_${dimension}_${depth}`, `n_${dimension}_${depth}`]
        variableList.push(...newVariables)
        queryString += dedent/*cypher*/`\n
            call {
                with n_${(dimension > 0 && depth === 1) ? 0 : dimension}_${depth - 1}
                match (n_${(dimension > 0 && depth === 1) ? 0 : dimension}_${depth - 1})${nodeRelation.direction === 'from' ? '<' : ''}-[r_${dimension}_${depth}:${relationshipType}]-${nodeRelation.direction === 'to' ? '>' : ''}(n_${dimension}_${depth}:${nodeRelation.nodeType})
                ${'options' in nodeRelation && nodeRelation.options && 'limit' in nodeRelation.options
                ? dedent/*cypher*/`
                    return ${newVariables.join(', ')}
                    limit ${nodeRelation.options.limit}
                ` : dedent/*cypher*/`return ${newVariables.join(', ')}`
            }
            }
        `
        const relationshipKeys = Object.keys(nodeRelation)
            .filter((key) => !['direction', 'nodeType', 'options'].includes(key))
            .map((key) => [key.split('-')[1], key])
        relationshipKeys.forEach(([relationshipType, queryPathKey], idx) => {
            createPath(relationshipType, nodeRelation[queryPathKey as keyof typeof nodeRelation] as NodeRelation, idx, depth + 1)
        })
    }
    relationshipKeys.forEach(([relationshipType, queryPathKey], idx) => queryPath[queryPathKey] && createPath(relationshipType, queryPath[queryPathKey] as NodeRelation, idx, 1))
    queryString += dedent/*cypher*/`\n
        return ${variableList.join(', ')}
    `
    console.log(queryString)
    const collection = await neo4jDriver().executeQuery<EagerCollectionResult>(queryString, {
        indexValue: 'indexValue' in params ? params.indexValue : undefined
    }).then(async (result) => {
        await writeFile('tests/collect:result.json', JSON.stringify(result, null, 2))
        const accLogFileHandle = await open('tests/collect:acc.json', 'a')
        return result.records.reduce((acc, record) => {
            const nodeMap = new TypedRecord(record)
            const handleCurrentNodeDepth = ({
                nodeMap,
                acc,
            }: {
                nodeMap: TypedRecord
                acc: NodeAccumulator
            }) => {
                const relationship = nodeMap.get(`r_${acc.pathIdx}_${acc.depthIdx}`);
                const referenceNode = (acc.depthIdx - 1) === 0
                    ? nodeMap.get(`n_0_0`)
                    : nodeMap.get(`n_${acc.pathIdx}_${acc.depthIdx - 1}`)
                const currentNodeTo = (<NextUixDataNode>(Array.isArray(acc.nextDepth)
                    ? acc.nextDepth.find(([nodeId]) => nodeId === referenceNode.nodeId)![1]
                    : acc.nextDepth))
                if (isManyRelationship(relationship)) {
                    if (!currentNodeTo[relationship.relationshipType]) {
                        const node = nodeMap.get(`n_${acc.pathIdx}_${acc.depthIdx}`);
                        currentNodeTo[relationship.relationshipType] = [[node.nodeId, { ...relationship, ...node }]];
                        (<NextUixDataNode>acc[acc.depthIdx === 1 ? 'rootDepth' : 'nextDepth'])[
                            relationship.relationshipType
                        ] = [[node.nodeId, { ...relationship, ...node }]]
                    } else {
                        const node = nodeMap.get(`n_${acc.pathIdx}_${acc.depthIdx}`);
                        (<NodeMapEntry[]>currentNodeTo[relationship.relationshipType]) =
                            (<NodeMapEntry[]>currentNodeTo[relationship.relationshipType]).some(([nodeId]) => nodeId === node.nodeId)
                                ? (<NodeMapEntry[]>currentNodeTo[relationship.relationshipType])
                                : (<NodeMapEntry[]>currentNodeTo[relationship.relationshipType])
                                    .concat([[node.nodeId, { ...relationship, ...node }]])
                    }
                } else {
                    if (!currentNodeTo[relationship.relationshipType]) {
                        currentNodeTo[relationship.relationshipType] = nodeMap.get(`n_${acc.pathIdx}_${acc.depthIdx}`)
                    }
                }
                accLogFileHandle.write(JSON.stringify(acc, null, 2) + "\n")
                // Set next depth
                acc.nextDepth = currentNodeTo[relationship.relationshipType]
                acc.depthIdx += 1
                return acc
            }
            return Array.from({ length: ((nodeMap.keys().length - 1) / 2) + 1 }, (_, index) => index).reduce((acc, idx) => {
                // Handle Root Node
                if (idx === 0) {
                    const rootNode = nodeMap.get(`n_0_0`)
                    if (params.referenceType === 'nodeType') {
                        acc.rootDepth = (acc.rootDepth && Array.isArray(acc.rootDepth))
                            ? acc.rootDepth.some(([nodeId]) => nodeId === rootNode.nodeId)
                                ? acc.rootDepth : acc.rootDepth.concat([[rootNode.nodeId, rootNode]]) //[...acc.rootDepth, [rootNode.nodeId, rootNode]]
                            : [[rootNode.nodeId, rootNode]]
                    } else {
                        acc.rootDepth = acc.rootDepth || rootNode
                    }
                    acc.nextDepth = acc.rootDepth
                    acc.depthIdx = 1
                    return acc
                }
                // Advance Path Index
                if (!nodeMap.has(`n_${acc.pathIdx}_${acc.depthIdx}`)) {
                    console.log("Advancing path")
                    acc.pathIdx += 1
                    acc.depthIdx = 1;
                    acc.nextDepth = acc.rootDepth
                }
                return handleCurrentNodeDepth({ nodeMap, acc })
            }, {
                ...acc,
                pathIdx: 0,
                depthIdx: 0,
                nextDepth: acc.rootDepth
            })
        }, {
            pathIdx: 0,
            depthIdx: 0,
        } as NodeAccumulator).rootDepth
    })

    return Ok(collection as unknown as QueryPath)
})