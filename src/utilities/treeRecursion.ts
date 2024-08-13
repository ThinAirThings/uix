import { RelationshipKey } from "../types"
import { getRelationshipEntries } from "./getRelationshipEntries"


type TreeNode<T> = T & {
    [relationship: RelationshipKey]: TreeNode<T>
}

export const treeRecursion = <T>({
    treeNode, 
    operation, 
    mapId,
    parentNodeMap,
    relationshipKey
}:{
    treeNode: TreeNode<T>,
    parentNodeMap?: Record<string, TreeNode<T>>,
    operation: ({treeNode, relationshipKey, mapId, parentNodeMap}:{treeNode: TreeNode<T>, parentNodeMap?: Record<string, TreeNode<T>>, relationshipKey?: RelationshipKey, mapId?: string}) => 'exit' | 'continue',
    mapId?: string,
    relationshipKey?: RelationshipKey
}) => {
    if (operation({treeNode, relationshipKey, mapId, parentNodeMap}) === 'exit') {
        return treeNode
    }
    getRelationshipEntries(treeNode).forEach(([relationshipKey, nodeMap]: [string, Record<string, TreeNode<T>>]) => {
        Object.entries(nodeMap).forEach(([mapId, childNode]: [string, TreeNode<T>]) =>
            treeRecursion({
                treeNode: childNode, 
                operation: operation,
                parentNodeMap: nodeMap,
                mapId: mapId,
                relationshipKey: relationshipKey as RelationshipKey
            })
        )
    })
    return treeNode
}