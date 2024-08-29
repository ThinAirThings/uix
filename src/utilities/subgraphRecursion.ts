import { getRelationshipEntries } from "./getRelationshipEntries"

export type RelationshipMapKey = `-${string}->${string}` | `<-${string}-${string}`
export type SubgraphNode<T> = T & {
    [relationship: RelationshipMapKey]: SubgraphNode<T>
}

export const subgraphRecursion = <T>({
    nextNode, 
    operation, 
    mapId,
    previousNode,
    previousNodeMap,
    relationshipKey
}:{
    nextNode: SubgraphNode<T>,
    previousNode?: SubgraphNode<T>,
    previousNodeMap?: Record<string, SubgraphNode<T>>,
    operation: ({nextNode, relationshipKey, mapId, previousNode, previousNodeMap}:{nextNode: SubgraphNode<T>, previousNode?: SubgraphNode<T>, previousNodeMap?: Record<string, SubgraphNode<T>>, relationshipKey?: RelationshipMapKey, mapId?: string}) => 'exit' | 'continue',
    mapId?: string,
    relationshipKey?: RelationshipMapKey
}) => {
    if (operation({nextNode, relationshipKey, mapId, previousNode, previousNodeMap}) === 'exit') {
        return nextNode
    }
    getRelationshipEntries(nextNode).forEach(([relationshipKey, nodeMap]: [string, Record<string, SubgraphNode<T>>]) => {
        Object.entries(nodeMap).forEach(([mapId, nextNextNode]: [string, SubgraphNode<T>]) =>
            subgraphRecursion({
                nextNode: nextNextNode, 
                operation: operation,
                previousNode: nextNode,
                previousNodeMap: nodeMap,
                mapId: mapId,
                relationshipKey: relationshipKey as RelationshipMapKey
            })
        )
    })
    return nextNode
}