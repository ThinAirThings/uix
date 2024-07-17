import { GenericNodeDefinitionMap } from "../definitions/NodeDefinition"
import { CardinalityTypeSet, GenericRelationshipDefinition, StrengthTypeSet } from "../definitions/RelationshipDefinition"
import { GenericNodeKey, NodeKey } from "../types/NodeKey"

export type GenericRelationshipMap = Record<string, {
    to: GenericNodeKey | GenericNodeKey[]
    state?: Record<string, any>
} | {
    from: GenericNodeKey | GenericNodeKey[]
    state?: Record<string, any>
} | undefined> | undefined

export const formatRelationshipMap = (
    nodeTypeMap: GenericNodeDefinitionMap,
    nodeType: keyof GenericNodeDefinitionMap,
    relationshipMap: GenericRelationshipMap
) => relationshipMap 
    ? Object.entries(relationshipMap).reduce((acc, [relType, relData]) => {
        if (!relData) return acc
        const relationshipDefinition = ('to' in relData
            ? nodeTypeMap[nodeType]
                    .relationshipDefinitionSet.find(definition => definition.type === relType)
            : Array.isArray(relData.from)
                ? nodeTypeMap[relData.from[0].nodeType]
                    .relationshipDefinitionSet.find(definition => definition.type === relType)
                : nodeTypeMap[relData.from.nodeType]
                    .relationshipDefinitionSet.find(definition => definition.type === relType)
        ) as GenericRelationshipDefinition

        if ('state' in relData) {
            acc[relType] = 'to' in relData ? {
                strength: relationshipDefinition.strength,
                cardinality: relationshipDefinition.cardinality,
                to: Array.isArray(relData.to) ? relData.to : [relData.to],
                state: relData.state ?? {}
            }: {
                strength: relationshipDefinition.strength,
                cardinality: relationshipDefinition.cardinality,
                from: Array.isArray(relData.from) ? relData.from : [relData.from],
                state: relData.state ?? {}
            }
            return acc
        }
        acc[relType] = 'to' in relData ? {
            strength: relationshipDefinition.strength,
            cardinality: relationshipDefinition.cardinality,
            to: Array.isArray(relData.to) ? relData.to : [relData.to],
            state: {}
        } : {
            strength: relationshipDefinition.strength,
            cardinality: relationshipDefinition.cardinality,
            from: Array.isArray(relData.from) ? relData.from : [relData.from],
            state: {}
        }
        return acc
    }, {} as Record<string, {
        strength: StrengthTypeSet
        cardinality: CardinalityTypeSet
        to: GenericNodeKey[]
        state: Record<string, any>
    } | {
        strength: StrengthTypeSet
        cardinality: CardinalityTypeSet
        from: GenericNodeKey[]
        state: Record<string, any>
    }>)
    : {}