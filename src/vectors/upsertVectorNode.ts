import { Driver } from "neo4j-driver";
import OpenAI from "openai";
import { AnyNodeShape, GenericNodeType, GenericNodeTypeMap } from "../types/NodeType";
import { upsertMatchToRelationship } from "./upsertMatchToRelationship";
import { upsertPropertyVector } from "./upsertPropertyVector";
import { upsertMatches } from "./upsertMatches";

export const upsertVectorNode = async (
    neo4jDriver: Driver,
    openaiClient: OpenAI,
    nodeShape: AnyNodeShape,
    nodeTypeMap: GenericNodeTypeMap
) => {

    await Promise.all([
        // Create Property Vectors
        ...(<GenericNodeType>nodeTypeMap[nodeShape.nodeType]).propertyVectors.map(async propertyVectorKey => await upsertPropertyVector(
            neo4jDriver,
            openaiClient,
            propertyVectorKey,
            nodeShape
        ))
    ])
    // This gathers the matchToRelationshipTypes from the graph structure that are relevant to this specific node
    const matchToRelationshipComponents = Object.values(nodeTypeMap).map(nodeType =>
    ({
        nodeType,
        matchNodeTypes: nodeType.matchToRelationshipTypeSet.filter(matchToRelationshipType =>
            [matchToRelationshipType.matchToNodeType.type, ...matchToRelationshipType.weightedNodeTypeSet.map(({ NodeType }) => NodeType.type)]
                .some(matchNodeType => nodeShape.nodeType === matchNodeType)
        ).flat()
    })
    )
    // Handle Vector Operations
    const toNodes = await Promise.all([
        // Create Summary in background
        ...matchToRelationshipComponents.length
            ? matchToRelationshipComponents
                .map(({ nodeType, matchNodeTypes }) => matchNodeTypes.flatMap(async matchNodeType => await upsertMatchToRelationship(
                    neo4jDriver,
                    openaiClient,
                    nodeShape,
                    matchNodeType,
                    nodeType
                ))).flat()
            : [],
    ])
    console.log("TO NODES!!!")
    console.log(toNodes)
    // // Note: You need to figure out how to get a hold of the fromNode
    if (!toNodes.length) return
    await Promise.all(toNodes.map(async toNode => await upsertMatches(
        neo4jDriver,
        toNode!,
        nodeTypeMap[toNode!.nodeType].matchToRelationshipTypeSet[0]
    )))

}