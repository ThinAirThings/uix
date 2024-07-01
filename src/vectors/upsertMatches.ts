import { Driver } from "neo4j-driver";
import { GenericNodeShape } from "../types/NodeType";
import dedent from 'dedent'
import { GenericMatchToRelationshipType } from "../types/MatchToRelationshipType";



export const upsertMatches = async (
    neo4jDriver: Driver,
    nodeShape: GenericNodeShape,
    matchToRelationshipType: GenericMatchToRelationshipType
) => {
    const matchToNodeCollectionResult = await neo4jDriver.executeQuery(dedent/*cypher*/`
        // Match the initial nodes and collect the toNodes
        match (:${nodeShape.nodeType} {nodeId: $fromNode.nodeId})<-
            [:CHILD_TO|UNIQUE_TO*]-
            (toNode:${matchToRelationshipType.weightedNodeTypeSet.map(({ NodeType }) => NodeType.type).join('|')})
        
        // Match vector nodes and collect embeddings along with weights
        match (vectorNode:${matchToRelationshipType.type})-[:VECTOR_TO]->(toNode)
        with collect({
            type: labels(vectorNode),
            embedding: vectorNode.nodeTypeEmbedding,
            weight: 
                CASE ${matchToRelationshipType.weightedNodeTypeSet.map(({ weight, NodeType }) => dedent/*cypher*/`
                    WHEN any(label in labels(toNode) WHERE label = '${NodeType.type}') THEN ${weight}`)
            .join(' ')}
                    ELSE 1
                END
        }) as weightedEmbeddings
        with [i in range(0, size(weightedEmbeddings[0].embedding)-1) |
            reduce(sum = 0.0, weightedEmbedding in weightedEmbeddings | sum + toFloat(weightedEmbedding.embedding[i]) * weightedEmbedding.weight) / 
            reduce(sum = 0.0, weightedEmbedding in weightedEmbeddings | sum + weightedEmbedding.weight)
        ] as centroid
        call db.index.vector.queryNodes('${matchToRelationshipType.matchToNodeType.type}_vector', 5, centroid)
        yield node as matchToVectorNode, score 
        match (matchToNode: ${matchToRelationshipType.matchToNodeType.type} {nodeId: matchToVectorNode.nodeId})
        match (fromNode: ${nodeShape.nodeType} {nodeId: $fromNode.nodeId})
        merge (matchToNode)<-[match_to:MATCH_TO { type: $matchToType }]-(fromNode)
            on create 
                set 
                    match_to.fromNodeId = $fromNode.nodeId,
                    match_to.type = $matchToType,
                    match_to.toNodeId = matchToNode.nodeId,
                    match_to.createdAt = timestamp(),
                    match_to.updatedAt = timestamp(),
                    match_to.score = score
            on match
                set match_to.updatedAt = timestamp(),
                    match_to.score = score 
        return count(matchToNode) as count, score, matchToNode
    `, {
        fromNode: nodeShape,
        matchToType: matchToRelationshipType.matchToNodeType.type,
    })
    return matchToNodeCollectionResult.records.map(record => ({
        count: record.get('count'),
        score: record.get('score'),
        matchToNode: record.get('matchToNode').properties
    }))
}