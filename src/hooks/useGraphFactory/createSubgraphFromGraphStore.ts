import { GenericNodeShape, GenericSubgraphDefinition } from "@thinairthings/uix"
import { graphStore } from "./graphStore"



export type Subgraph = GenericNodeShape | {[relationshipType: string]: {[nodeId: string]: Subgraph} | {}}
export const createSubgraphFromGraphStore = ({
    pathSegment,
    subgraphDefinition,
    treeNode
}:{
    pathSegment: string, 
    subgraphDefinition?: GenericSubgraphDefinition,
    treeNode: Subgraph | undefined
}) => {
    if (!treeNode) return
    if (!subgraphDefinition) return treeNode
    const pathLength = pathSegment.split('-').length
    const nextPathDefinitionSet = subgraphDefinition
        .pathDefinitionSet
        .filter(path => path.pathType.startsWith(pathSegment) 
            && path.pathType.split('-').length === pathLength + 2
        )
    nextPathDefinitionSet.forEach((nextPathDefinition) => {
        const nextPathSegments = nextPathDefinition.pathType.split('-')
        const _nextRelationship = nextPathSegments.slice(nextPathSegments.length - 2).join('-')
        const nextRelationship = (_nextRelationship.includes('>') ? `-${_nextRelationship}` : `<-${_nextRelationship}`) as keyof typeof treeNode
        const nextNodeType = nextPathSegments[nextPathSegments.length - 1].replaceAll('>', '') as string
        treeNode[nextRelationship] = nextRelationship.includes('->')
            ? graphStore.getState().fromNodePointerMap.get(`${treeNode.nodeId}:${nextRelationship.split('-')[1]}:${nextNodeType}`)?.values().reduce((acc, nextNodeId) => {
                acc[nextNodeId] = {
                    ...graphStore.getState().nodeMap.get(nextNodeId)!,
                    ...graphStore.getState().relationshipMap.get(`${treeNode.nodeId}:${nextRelationship.split('-')[1]}:${nextNodeId}`)
                }
                return acc
            }, {} as {[nodeId: string]: Subgraph})??{}
            : graphStore.getState().toNodePointerMap.get(`${treeNode.nodeId}:${nextRelationship.split('-')[1]}:${nextNodeType}`)?.values().reduce((acc, nextNodeId) => {
                acc[nextNodeId] = {
                    ...graphStore.getState().nodeMap.get(nextNodeId)!,
                    ...graphStore.getState().relationshipMap.get(`${nextNodeId}:${nextRelationship.split('-')[1]}:${treeNode.nodeId}`)
                }
                return acc
            }, {} as {[nodeId: string]: Subgraph})??{}
        Object.values(treeNode[nextRelationship]).forEach((nextNode) => {
            createSubgraphFromGraphStore({
                pathSegment: nextPathDefinition.pathType,
                subgraphDefinition,
                treeNode: nextNode
            })
        })
    })
    return treeNode
}