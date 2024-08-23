import { AnyNodeShape, GenericNodeType, GenericNodeTypeMap } from "../definitions/NodeDefinition";
import { upsertPropertyVector } from "./upsertPropertyVector";
import { upsertMatchTypeEmbedding } from "./upsertMatchTypeEmbedding";
import { upsertMatchesv2 } from "./upsertMatchesv2";

export const upsertVectorNode = async (
    nodeShape: AnyNodeShape,
    nodeDefinitionMap: GenericNodeTypeMap
) => {

    await Promise.all([
        // Create Property Vectors
        ...(<GenericNodeType>nodeDefinitionMap[nodeShape.nodeType]).propertyVectors.map(async propertyVectorKey => await upsertPropertyVector(
            propertyVectorKey,
            nodeShape
        ))
    ])
    // Check all possible fromNodeTypes to see which ones are associated with the nodeShape in question.
    const fromNodeTypesAndRelationshipTypesToDirectlyUpdate = Object.values(nodeDefinitionMap).map(fromNodeType => ({
        fromNodeType,
        matchToRelationshipTypeSet: fromNodeType.matchToRelationshipTypeSet.filter(matchToRelationshipType =>
            matchToRelationshipType.weightednodeDefinitionSet.some(({ NodeType }) => NodeType.type === nodeShape.nodeType)
        )
    }))
    const fromNodeTypesToUpdateMatches = Object.values(nodeDefinitionMap).map(fromNodeType => ({
        fromNodeType,
        matchToRelationshipTypeSet: fromNodeType.matchToRelationshipTypeSet.filter(matchToRelationshipType =>
            matchToRelationshipType.weightednodeDefinitionSet.some(({ NodeType }) => NodeType.type === nodeShape.nodeType)
            || matchToRelationshipType.matchToNodeType.type === nodeShape.nodeType
        )
    }))
    // Update all nodes that have a direct relationship to the nodeShape
    const updatedTargetNodes = await Promise.all([
        ...fromNodeTypesAndRelationshipTypesToDirectlyUpdate.map(async ({ fromNodeType, matchToRelationshipTypeSet }) =>
            await Promise.all(matchToRelationshipTypeSet.map(async matchToRelationshipType => await upsertMatchTypeEmbedding(
                nodeShape,
                fromNodeType,
                matchToRelationshipType
            )))
        )
    ]).then(res => res.flat().filter(node => node !== undefined))
    // Add matches to targetNode
    await Promise.all(updatedTargetNodes.map(async (targetNode) =>
        await Promise.all(nodeDefinitionMap[targetNode.nodeType].matchToRelationshipTypeSet.map(async matchToRelationshipType => await upsertMatchesv2(
            targetNode,
            matchToRelationshipType
        )))
    ))

}