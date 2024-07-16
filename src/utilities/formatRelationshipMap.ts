import { GenericNodeKey, NodeKey } from "../types/NodeKey"
import { GenericRelativeRelationshipMap, RelativeRelationshipMap } from "../types/RelationshipMap"

export type GenericRelationshipMap = Record<string, {
    to: GenericNodeKey | GenericNodeKey[]
    state?: Record<string, any>
} | {
    from: GenericNodeKey | GenericNodeKey[]
    state?: Record<string, any>
} | {
    to: GenericNodeKey | GenericNodeKey[]
    from: GenericNodeKey | GenericNodeKey[]
    state?: Record<string, any>
} | undefined> | undefined

export const formatRelationshipMap = (relationshipMap: GenericRelationshipMap) => relationshipMap 
    ? Object.entries(relationshipMap).reduce((acc, [relType, relData]) => {
        if (!relData) return acc
        if ('state' in relData) {
            acc[relType] = 'to' in relData ? {
                to: Array.isArray(relData.to) ? relData.to : [relData.to],
                state: relData.state ?? {}
            }: {
                from: Array.isArray(relData.from) ? relData.from : [relData.from],
                state: relData.state ?? {}
            }
            return acc
        }
        acc[relType] = 'to' in relData ? {
            to: Array.isArray(relData.to) ? relData.to : [relData.to],
            state: {}
        } : {
            from: Array.isArray(relData.from) ? relData.from : [relData.from],
            state: {}
        }
        return acc
    }, {} as Record<string, {
        to: GenericNodeKey[]
        state: Record<string, any>
    } | {
        from: GenericNodeKey[]
        state: Record<string, any>
    }>)
    : {}