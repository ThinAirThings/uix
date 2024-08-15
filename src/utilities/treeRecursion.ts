import { RelationshipKey } from "../types"
import { getRelationshipEntries } from "./getRelationshipEntries"


type TreeNode<T> = T & {
    [relationship: RelationshipKey]: TreeNode<T>
}

export const treeRecursion = <T>({
    treeNode, 
    operation, 
    mapId,
    parentNode,
    parentNodeMap,
    relationshipKey
}:{
    treeNode: TreeNode<T>,
    parentNode?: TreeNode<T>,
    parentNodeMap?: Record<string, TreeNode<T>>,
    operation: ({treeNode, relationshipKey, mapId, parentNode, parentNodeMap}:{treeNode: TreeNode<T>, parentNode?: TreeNode<T>, parentNodeMap?: Record<string, TreeNode<T>>, relationshipKey?: RelationshipKey, mapId?: string}) => 'exit' | 'continue',
    mapId?: string,
    relationshipKey?: RelationshipKey
}) => {
    if (operation({treeNode, relationshipKey, mapId, parentNode, parentNodeMap}) === 'exit') {
        return treeNode
    }
    getRelationshipEntries(treeNode).forEach(([relationshipKey, nodeMap]: [string, Record<string, TreeNode<T>>]) => {
        Object.entries(nodeMap).forEach(([mapId, childNode]: [string, TreeNode<T>]) =>
            treeRecursion({
                treeNode: childNode, 
                operation: operation,
                parentNode: treeNode,
                parentNodeMap: nodeMap,
                mapId: mapId,
                relationshipKey: relationshipKey as RelationshipKey
            })
        )
    })
    return treeNode
}