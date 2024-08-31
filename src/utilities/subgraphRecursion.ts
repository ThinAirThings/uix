import { getRelationshipEntries } from "./getRelationshipEntries"

export type RelationshipMapKey = `-${string}->${string}` | `<-${string}-${string}`
export type SubgraphNode<T> = T & {
    [relationship: RelationshipMapKey]: SubgraphNode<T>
}

export const subgraphRecursion = <T>({
    nextNode, 
    operation, 
    nodeId,
    previousNode,
    previousNodeMap,
    relationshipKey
}:{
    nextNode: SubgraphNode<T>,
    previousNode?: SubgraphNode<T>,
    previousNodeMap?: Record<string, SubgraphNode<T>>,
    operation: ({nextNode, relationshipKey, nodeId, previousNode, previousNodeMap}:{nextNode: SubgraphNode<T>, previousNode?: SubgraphNode<T>, previousNodeMap?: Record<string, SubgraphNode<T>>, relationshipKey?: RelationshipMapKey, nodeId?: string}) => 'exit' | 'continue',
    nodeId?: string,
    relationshipKey?: RelationshipMapKey
}) => {
    if (operation({nextNode, relationshipKey, nodeId, previousNode, previousNodeMap}) === 'exit') {
        return nextNode
    }
    getRelationshipEntries(nextNode).forEach(([relationshipKey, nodeMap]: [string, Record<string, SubgraphNode<T>>]) => {
        Object.entries(nodeMap).forEach(([nodeId, nextNextNode]: [string, SubgraphNode<T>]) =>
            subgraphRecursion({
                nextNode: nextNextNode, 
                operation: operation,
                previousNode: nextNode,
                previousNodeMap: nodeMap,
                nodeId: nodeId,
                relationshipKey: relationshipKey as RelationshipMapKey
            })
        )
    })
    return nextNode
}