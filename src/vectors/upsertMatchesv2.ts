import { Driver, EagerResult, Integer, Node } from "neo4j-driver";
import { GenericNodeShape } from "../types/NodeType";
import { GenericMatchToRelationshipType } from "../types/MatchToRelationshipType";
import dedent from "dedent";
import { neo4jDriver } from "../clients/neo4j";




export const upsertMatchesv2 = async (
    fromNode: GenericNodeShape,
    matchToRelationshipType: GenericMatchToRelationshipType
) => {
    // Run Query
    const matches = await neo4jDriver().executeQuery<EagerResult<{
        score: number,
        matchToNode: Node<Integer, GenericNodeShape>
    }>>(dedent/*cypher*/`
        match (fromNode: ${fromNode.nodeType} {nodeId: $fromNode.nodeId})<-[:VECTOR_TO]-(fromNodeVectorNode:${fromNode.nodeType}Vector:${matchToRelationshipType.type})
        call db.index.vector.queryNodes('${matchToRelationshipType.matchToNodeType.type}_vector', 100, fromNodeVectorNode.nodeTypeEmbedding)
        yield node as matchToVectorNode, score
        match (matchToNode: ${matchToRelationshipType.matchToNodeType.type} {nodeId: matchToVectorNode.nodeId})
        merge (fromNode)-[match_to:MATCH_TO { type: $matchToType }]->(matchToNode)
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
        return score, matchToNode  
    `, {
        fromNode,
        matchToType: matchToRelationshipType.matchToNodeType.type
    }).then(res => res.records.map(record => ({
        score: record.get('score'),
        matchToNode: record.get('matchToNode').properties
    })))
    return matches
}