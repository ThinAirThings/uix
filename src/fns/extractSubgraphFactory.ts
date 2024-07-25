import { EagerResult, Integer, Node, Relationship } from "neo4j-driver"
import { neo4jAction, neo4jDriver } from "../clients/neo4j"
import { AnyNodeDefinitionMap, NodeShape } from "../definitions/NodeDefinition"
import { Ok } from "../types/Result"
import dedent from "dedent"
import { AnyRelationshipDefinition, CardinalityTypeSet,  StrengthTypeSet } from "../definitions/RelationshipDefinition"
import { AnyExtractionNode,  GenericExtractionNode, RootExtractionNode } from "../types/ExtractionNode"
import { Dec, Inc } from "@thinairthings/utilities"
import { AnyExtractionSubgraph, ExtractionOptions, ExtractionSubgraph } from "../types/ExtractionSubgraph"


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
type NextUixDataNode = ({
    [relationshipType: string]: UixDataNode | UixDataNode[]
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
    rootDepth: UixDataNode | UixDataNode[]
    nextDepth: UixDataNode | UixDataNode[]
}

export const extractSubgraphFactory = <
    NodeDefinitionMap extends AnyNodeDefinitionMap,
>(
    nodeDefinitionMap: NodeDefinitionMap
) => neo4jAction(async <
    NodeType extends keyof NodeDefinitionMap,
    ReferenceType extends 'nodeType' | 'nodeIndex',
    TypedSubgraph extends AnyExtractionSubgraph | undefined = undefined,
>(params: ({
    nodeType: NodeType
}) & (
        ReferenceType extends 'nodeType'
        ? ({
            referenceType: ReferenceType
            options?: ExtractionOptions
        }) : ({
            referenceType: ReferenceType
            indexKey: NodeDefinitionMap[NodeType]['uniqueIndexes'][number]
            indexValue: string
        })
    ) & ({
        subgraphSelector?: (subgraph: ExtractionSubgraph<NodeDefinitionMap, `n_0_0`, readonly [
            RootExtractionNode<NodeDefinitionMap, NodeType>
        ]>) => TypedSubgraph
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
    const subgraph = params.subgraphSelector?.(ExtractionSubgraph.create(nodeDefinitionMap, params.nodeType)) ?? null
    if (subgraph) {
        const subgraphQueryTree = subgraph.getQueryTree()
        const relationshipKeys = Object.keys(subgraphQueryTree )
            .filter((key) => !['direction', 'nodeType', 'options'].includes(key))
            .map((key) => [key.split('-')[1], key])
        console.log("Relationship Keys", relationshipKeys)
        relationshipKeys.forEach(
            ([relationshipType, queryPathKey], idx) => subgraphQueryTree[queryPathKey as keyof typeof subgraphQueryTree] 
            && createPath(relationshipType, subgraphQueryTree[queryPathKey as keyof typeof subgraphQueryTree] as NodeRelation, idx, 1)
        )
    }
    queryString += dedent/*cypher*/`\n
        return ${variableList.join(', ')}
    `
    const collection = await neo4jDriver().executeQuery<EagerCollectionResult>(queryString, {
        indexValue: 'indexValue' in params ? params.indexValue : undefined
    }).then(async (result) => {
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
                const relationshipKey = (<GenericExtractionNode>subgraph?.nodeSet.find((node: GenericExtractionNode) => node.nodeIndex === `n_${acc.pathIdx}_${acc.depthIdx}`))?.relationship
                const referenceNode = (acc.depthIdx - 1) === 0
                    ? nodeMap.get(`n_0_0`)
                    : nodeMap.get(`n_${acc.pathIdx}_${acc.depthIdx - 1}`)
                const currentNodeTo = (<NextUixDataNode>(Array.isArray(acc.nextDepth)
                    ? acc.nextDepth.find((node) => node.nodeId === referenceNode.nodeId)
                    : acc.nextDepth))
                if (isManyRelationship(relationship)) {
                    if (!currentNodeTo[relationshipKey]) {
                        const node = nodeMap.get(`n_${acc.pathIdx}_${acc.depthIdx}`);
                        currentNodeTo[relationshipKey] = [{ ...relationship, ...node }];
                        (<NextUixDataNode>acc[acc.depthIdx === 1 ? 'rootDepth' : 'nextDepth'])[
                            relationshipKey
                        ] = [{ ...relationship, ...node }]
                    } else {
                        const referenceNode = nodeMap.get(`n_${acc.pathIdx}_${acc.depthIdx}`);
                        (<UixDataNode[]>currentNodeTo[relationshipKey]) =
                            (<UixDataNode[]>currentNodeTo[relationshipKey]).some((node) => node.nodeId === referenceNode.nodeId)
                                ? (<UixDataNode[]>currentNodeTo[relationshipKey])
                                : (<UixDataNode[]>currentNodeTo[relationshipKey])
                                    .concat([{ ...relationship, ...referenceNode }])
                    }
                } else {
                    if (!currentNodeTo[relationshipKey]) {
                        currentNodeTo[relationshipKey] = nodeMap.get(`n_${acc.pathIdx}_${acc.depthIdx}`)
                    }
                }
                // Set next depth
                acc.nextDepth = currentNodeTo[relationshipKey]
                acc.depthIdx += 1
                return acc
            }
            return Array.from({ length: ((nodeMap.keys().length - 1) / 2) + 1 }, (_, index) => index).reduce((acc, idx) => {
                // Handle Root Node
                if (idx === 0) {
                    const rootNode = nodeMap.get(`n_0_0`)
                    if (params.referenceType === 'nodeType') {
                        acc.rootDepth = (acc.rootDepth && Array.isArray(acc.rootDepth))
                            ? acc.rootDepth.some((node) => node.nodeId === rootNode.nodeId)
                                ? acc.rootDepth : acc.rootDepth.concat([rootNode]) //[...acc.rootDepth, [rootNode.nodeId, rootNode]]
                            : [rootNode]
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

    return Ok(collection as ReferenceType extends 'nodeIndex'
        ? TypedSubgraph extends AnyExtractionSubgraph
            ? NodeShape<NodeDefinitionMap[NodeType]> & SubgraphTree<NodeDefinitionMap, TypedSubgraph>
            : NodeShape<NodeDefinitionMap[NodeType]>
        : TypedSubgraph extends AnyExtractionSubgraph
            ? (NodeShape<NodeDefinitionMap[NodeType]> & SubgraphTree<NodeDefinitionMap, TypedSubgraph>)[]
            : NodeShape<NodeDefinitionMap[NodeType]>[]
    )
})

export type SubgraphPath<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    Subgraph extends AnyExtractionSubgraph, 
    X extends number=0, 
    Y extends number = 1
> = `n_${X}_${Y}` extends Subgraph['nodeSet'][number]['nodeIndex']
    ? ({
        [Relationship in (Subgraph['nodeSet'][number] & {nodeIndex: `n_${X}_${Y}`})['relationship']]: 
            Relationship extends `-${infer RelationshipType}->${infer NextNodeType}`
                ? (NodeDefinitionMap[(Subgraph['nodeSet'][number] & {nodeIndex: `n_${Dec<Y> extends 0 ? 0 : X}_${Dec<Y>}`})['nodeType']]['relationshipDefinitionSet'][number]) extends (infer RelationshipUnionRef extends AnyRelationshipDefinition | never)
                    ? AnyRelationshipDefinition extends RelationshipUnionRef
                        ? (RelationshipUnionRef & { type: RelationshipType })['cardinality'] extends `${string}-to-many`
                            ? (NodeShape<NodeDefinitionMap[NextNodeType]>&SubgraphPath<NodeDefinitionMap, Subgraph, X, Inc<Y>>)[]
                            : (NodeShape<NodeDefinitionMap[NextNodeType]>&SubgraphPath<NodeDefinitionMap, Subgraph, X, Inc<Y>>)
                        : never
                    : never
            : Relationship extends `<-${infer RelationshipType}-${infer NextNodeType}`
                ? (NodeDefinitionMap[NextNodeType]['relationshipDefinitionSet'][number]) extends (infer RelationshipUnionRef extends AnyRelationshipDefinition | never)
                    ? AnyRelationshipDefinition extends RelationshipUnionRef
                        ? (RelationshipUnionRef & { type: RelationshipType })['cardinality'] extends `many-to-${string}`
                            ? (NodeShape<NodeDefinitionMap[NextNodeType]>&SubgraphPath<NodeDefinitionMap, Subgraph, X, Inc<Y>>)[]
                            : (NodeShape<NodeDefinitionMap[NextNodeType]>&SubgraphPath<NodeDefinitionMap, Subgraph, X, Inc<Y>>)
                        : never
                    : never
                : never
    })
    : unknown

export type SubgraphTree<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    Subgraph extends AnyExtractionSubgraph, 
    X extends number = 0
> = SubgraphPath<NodeDefinitionMap, Subgraph> & (`n_${X}_${1}` extends Subgraph['nodeSet'][number]['nodeIndex']
        ? SubgraphPath<NodeDefinitionMap, Subgraph, X> & SubgraphTree<NodeDefinitionMap, Subgraph, Inc<X>> 
        : unknown
)
