import { GenericNodeShape, GenericSubgraphDefinition, subgraphRecursion } from "@thinairthings/uix"
import { graphStore } from "./graphStore"
import { produce } from "immer"
import { createSubgraphFromGraphStore, Subgraph } from "./createSubgraphFromGraphStore"
import {QueryClient} from "@tanstack/react-query"
import _ from "lodash"
import { AnyNodeDefinitionMap, GenericNodeDefinitionMap } from "../../definitions/NodeDefinition"
import { GenericNodeKey, NodeKey } from "../../types/NodeKey"

export const subgraphControlMap = new Map<
string, {
    executionFlag: boolean
    subscriptionSet: Set<() => void>
}>()

const addSubgraphSubscription = ({
    nodeDefinitionMap,
    queryClient,
    subgraphKey,
    selector
}: {
    nodeDefinitionMap: GenericNodeDefinitionMap
    queryClient: QueryClient
    subgraphKey: readonly [NodeKey<GenericNodeDefinitionMap, any>, ...GenericSubgraphDefinition[]]
    selector: Parameters<typeof graphStore.subscribe>[0]
}) => {
    subgraphControlMap.set(
        JSON.stringify(subgraphKey),
        produce(subgraphControlMap.get(JSON.stringify(subgraphKey)) || {
            executionFlag: false,
            subscriptionSet: new Set<() => void>()
        }, draft => {
            (draft?.subscriptionSet || new Set()).add(graphStore.subscribe(
                selector,
                () => {
                    subgraphControlMap.set(
                        JSON.stringify(subgraphKey),
                        produce(subgraphControlMap.get(JSON.stringify(subgraphKey))!, draft => {
                            draft.executionFlag = false
                        })
                    )
                    const [rootNodeIndex, subgraphDefinition] = subgraphKey
                    const newSubgraph = createSubgraphFromGraphStore({
                        pathSegment: rootNodeIndex.nodeType,
                        subgraphDefinition: subgraphDefinition,
                        treeNode: graphStore.getState().nodeMap.get(rootNodeIndex.nodeId) 
                            ? JSON.parse(JSON.stringify(graphStore.getState().nodeMap.get(rootNodeIndex.nodeId))) as Subgraph
                            : undefined
                    }) as GenericNodeShape
                    queryClient.setQueryData(subgraphKey, newSubgraph)
                }
            ))
            draft.executionFlag = true
        })
    ) 
}

export const cycleSubgraphSubscriptions = ({
    nodeDefinitionMap,
    queryClient,
    subgraphKey,
    subgraph
}:{
    nodeDefinitionMap: GenericNodeDefinitionMap
    queryClient: QueryClient
    subgraphKey: readonly [GenericNodeKey, ...GenericSubgraphDefinition[]]
    subgraph: GenericNodeShape
}) => {
    // Remove all previous subscriptions
    subgraphControlMap.get(JSON.stringify(subgraphKey))?.subscriptionSet.forEach(unsubscribe => unsubscribe())
    // Clear
    subgraphControlMap.set(JSON.stringify(subgraphKey), {
        executionFlag: false,
        subscriptionSet: new Set<() => void>()
    })
    subgraphRecursion({
        nextNode: subgraph,
        operation: ({nextNode, previousNode, relationshipKey}) => {
            // Subscribe to [tnid]
            addSubgraphSubscription({
                nodeDefinitionMap,
                queryClient,
                subgraphKey,
                selector: state => state.nodeMap.get(nextNode.nodeId)
            })
            // Create Subscriptions for all possible relationships
            nodeDefinitionMap[nextNode.nodeType as keyof typeof nodeDefinitionMap]?.relationshipDefinitionSet.forEach(relationshipDefinition => {
                // Subscribe to [tnid:rT]
                addSubgraphSubscription({
                    nodeDefinitionMap,
                    queryClient,
                    subgraphKey,
                    selector: state => state.fromNodePointerMap.get(`${nextNode.nodeId}:${relationshipDefinition.type}:${relationshipDefinition.toNodeDefinition.type}`)
                })
            })
            Object.keys(nodeDefinitionMap).forEach(nodeType => {
                nodeDefinitionMap[nodeType as keyof typeof nodeDefinitionMap]?.relationshipDefinitionSet.forEach(relationshipDefinition => {
                    // Subscribe to [fnid:rT]
                    addSubgraphSubscription({
                        nodeDefinitionMap,
                        queryClient,
                        subgraphKey,
                        selector: state => state.toNodePointerMap.get(`${nextNode.nodeId}:${relationshipDefinition.type}:${nodeType}`)
                    })
                })
            })
            // Subscribe to [fnid:rT]: Set<tnid>
            if (!previousNode || !relationshipKey) return 'continue'
            addSubgraphSubscription({
                nodeDefinitionMap,
                queryClient,
                subgraphKey,
                selector: state => state.fromNodePointerMap.get(
                    relationshipKey.includes('->')
                        ? `${previousNode.nodeId}:${relationshipKey.split('->')[1]}:${nextNode.nodeType}`
                        : `${nextNode.nodeId}:${relationshipKey}:${previousNode.nodeType}`
                )
            })
            // Subscribe to [tnid:rT]: Set<fnid> 
            addSubgraphSubscription({
                nodeDefinitionMap,
                queryClient,
                subgraphKey,
                selector: state => state.toNodePointerMap.get(
                    relationshipKey.includes('->')
                        ? `${nextNode.nodeId}:${relationshipKey.split('->')[1]}:${previousNode.nodeType}`
                        : `${previousNode.nodeId}:${relationshipKey}:${nextNode.nodeType}`
                )
            })
            // Subscribe to [tnid:rT:fnid]
            addSubgraphSubscription({
                nodeDefinitionMap,
                queryClient,
                subgraphKey,
                selector: state => state.relationshipMap.get(
                    relationshipKey.includes('->')
                        ? `${previousNode.nodeId}:${relationshipKey.split('-')[1]}:${nextNode.nodeId}`
                        : `${nextNode.nodeId}:${relationshipKey.split('-')[1]}:${previousNode.nodeId}`
                )
            })
            return 'continue'
        }
    })
}