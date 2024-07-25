import { GenericNodeDefinitionMap } from "../definitions/NodeDefinition"
import { CardinalityTypeSet, GenericRelationshipDefinition, StrengthTypeSet } from "../definitions/RelationshipDefinition"
import { GenericNodeKey, NodeKey } from "../types/NodeKey"


type RelationshipMapEntry = 
    | GenericNodeKey 
    | GenericNodeKey[] 
    | ({
    nodeKey: GenericNodeKey
    state: Record<string, any>
})  | ({
    nodeKey: GenericNodeKey
    state: Record<string, any>
}[])
export type GenericRelationshipMap = Record<string, {
    to: RelationshipMapEntry
} | {
    from: RelationshipMapEntry
} | undefined> | undefined

Object.is
export const formatRelationshipMap = (
    nodeDefinitionMap: GenericNodeDefinitionMap,
    nodeType: keyof GenericNodeDefinitionMap,
    relationshipMap: GenericRelationshipMap
) => relationshipMap 
    ? Object.entries(relationshipMap).reduce((acc, [relType, relData]) => {
        if (!relData) return acc
        const relationshipDefinition = ('to' in relData
            ? nodeDefinitionMap[nodeType]
                    .relationshipDefinitionSet.find(definition => definition.type === relType)
            : Array.isArray(relData.from)
                ? 'state' in relData.from[0] 
                    ? nodeDefinitionMap[relData.from[0].nodeKey.nodeType]
                        .relationshipDefinitionSet.find(definition => definition.type === relType)
                    : nodeDefinitionMap[relData.from[0].nodeType]
                : 'state' in relData.from 
                    ? nodeDefinitionMap[relData.from.nodeKey.nodeType]
                        .relationshipDefinitionSet.find(definition => definition.type === relType)
                    : nodeDefinitionMap[relData.from.nodeType]
        ) as GenericRelationshipDefinition
        // "To" Section
        if ('to' in relData) {
            acc[relType] = Array.isArray(relData.to) 
            ? {
                strength: relationshipDefinition.strength,
                cardinality: relationshipDefinition.cardinality,
                to: relData.to.map((entry) => 'state' in entry ? ({
                    nodeKey: entry.nodeKey,
                    state: entry.state
                }) : ({
                    nodeKey: entry,
                    state: {}
                })),
            }: {
                strength: relationshipDefinition.strength,
                cardinality: relationshipDefinition.cardinality,
                to: ['state' in relData.to ? {
                    nodeKey: relData.to.nodeKey,
                    state: relData.to.state
                }: {
                    nodeKey: relData.to,
                    state: {}
                }]
            }
            return acc
        }
        // "From" Section
        acc[relType] = Array.isArray(relData.from)
        ?{
            strength: relationshipDefinition.strength,
            cardinality: relationshipDefinition.cardinality,
            from: relData.from.map((entry) => 'state' in entry ? ({
                nodeKey: entry.nodeKey,
                state: entry.state
            }) : ({
                nodeKey: entry,
                state: {}
            })),
        } : {
            strength: relationshipDefinition.strength,
            cardinality: relationshipDefinition.cardinality,
            from: ['state' in relData.from ? {
                nodeKey: relData.from.nodeKey,
                state: relData.from.state
            }: {
                nodeKey: relData.from,
                state: {}
            }]
        }
        return acc
    }, {} as Record<string, {
        strength: StrengthTypeSet
        cardinality: CardinalityTypeSet
        to: ({
            nodeKey: GenericNodeKey
            state: Record<string, any>
        }[])
    } | {
        strength: StrengthTypeSet
        cardinality: CardinalityTypeSet
        from: ({
            nodeKey: GenericNodeKey
            state: Record<string, any>
        }[])
    }>)
    : {}