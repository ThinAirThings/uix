import { Driver } from "neo4j-driver";
import OpenAI from "openai";
import { AnyNodeShape, GenericNodeType, GenericNodeTypeMap } from "../types/NodeType";
import { upsertPropertyVector } from "./upsertPropertyVector";
import { upsertMatches } from "./upsertMatches";
import { match } from "assert";
import { upsertMatchTypeEmbedding } from "./upsertMatchTypeEmbedding";
import { upsertMatchesv2 } from "./upsertMatchesv2";

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
    // Check all possible fromNodeTypes to see which ones are associated with the nodeShape in question.
    const fromNodeTypesAndRelationshipTypesToDirectlyUpdate = Object.values(nodeTypeMap).map(fromNodeType => ({
        fromNodeType,
        matchToRelationshipTypeSet: fromNodeType.matchToRelationshipTypeSet.filter(matchToRelationshipType =>
            matchToRelationshipType.weightedNodeTypeSet.some(({ NodeType }) => NodeType.type === nodeShape.nodeType)
        )
    }))
    const fromNodeTypesToUpdateMatches = Object.values(nodeTypeMap).map(fromNodeType => ({
        fromNodeType,
        matchToRelationshipTypeSet: fromNodeType.matchToRelationshipTypeSet.filter(matchToRelationshipType =>
            matchToRelationshipType.weightedNodeTypeSet.some(({ NodeType }) => NodeType.type === nodeShape.nodeType)
            || matchToRelationshipType.matchToNodeType.type === nodeShape.nodeType
        )
    }))
    // Update all nodes that have a direct relationship to the nodeShape
    const updatedTargetNodes = await Promise.all([
        ...fromNodeTypesAndRelationshipTypesToDirectlyUpdate.map(async ({ fromNodeType, matchToRelationshipTypeSet }) =>
            await Promise.all(matchToRelationshipTypeSet.map(async matchToRelationshipType => await upsertMatchTypeEmbedding(
                neo4jDriver,
                openaiClient,
                nodeShape,
                fromNodeType,
                matchToRelationshipType
            )))
        )
    ]).then(res => res.flat().filter(node => node !== undefined))
    // Add matches to targetNode
    await Promise.all(updatedTargetNodes.map(async (targetNode) =>
        await Promise.all(nodeTypeMap[targetNode.nodeType].matchToRelationshipTypeSet.map(async matchToRelationshipType => await upsertMatchesv2(
            neo4jDriver,
            targetNode,
            matchToRelationshipType
        )))
    ))

    // // // Note: You need to figure out how to get a hold of the fromNode
    // if (!toNodes.length) return
    // await Promise.all(toNodes.map(async toNode => await upsertMatches(
    //     neo4jDriver,
    //     toNode!,
    //     nodeTypeMap[toNode!.nodeType].matchToRelationshipTypeSet[0]
    // )))
}