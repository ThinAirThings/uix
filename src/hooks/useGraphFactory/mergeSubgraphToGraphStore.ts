import { GenericNodeShape, removeRelationshipEntries, subgraphRecursion } from "@thinairthings/uix"
import { graphStore } from "./graphStore"
import _ from "lodash"
import { AnyZodObject } from "zod"
import { produce } from "immer"
import { GenericNodeDefinitionMap } from "../../definitions/NodeDefinition"


export const mergeSubgraphToGraphStore = ({
    nodeDefinitionMap,
    data,
    replace
}:{
    nodeDefinitionMap: GenericNodeDefinitionMap,
    data: GenericNodeShape & {detach?: boolean, delete?: boolean},
    replace?: boolean
}) => {
    // Set Local Cache
    graphStore.setState(state => {
        subgraphRecursion({
            nextNode: data,
            operation: ({nextNode, previousNode, relationshipKey}) => {
                // Set [tnid]
                replace 
                    ? state.nodeMap.set(nextNode.nodeId, removeRelationshipEntries(nextNode) as GenericNodeShape)
                    : nextNode.delete
                        ? state.nodeMap.delete(nextNode.nodeId)
                        : state.nodeMap.set(
                            nextNode.nodeId,
                            _.merge(
                                state.nodeMap.get(nextNode.nodeId)??{}, 
                                _.pick(
                                    removeRelationshipEntries(nextNode),
                                    [
                                        ...['nodeId', 'nodeType', 'createdAt', 'updatedAt'],
                                        ...(nodeDefinitionMap[nextNode.nodeType as keyof typeof nodeDefinitionMap]?.stateSchema as AnyZodObject).keyof().options,
                                    ]
                                )
                            ) as GenericNodeShape
                        )
                // Setup for all possible relationships
                nodeDefinitionMap[nextNode.nodeType as keyof typeof nodeDefinitionMap]?.relationshipDefinitionSet.forEach(relationshipDefinition => {
                    const relationshipTypeKey = `${nextNode.nodeId}:${relationshipDefinition.type}:${relationshipDefinition.toNodeDefinition.type}` as const
                    state.fromNodePointerMap.has(relationshipTypeKey) || state.fromNodePointerMap.set(
                        relationshipTypeKey, new Set<string>()
                    )
                })
                Object.keys(nodeDefinitionMap).forEach(nodeType => {
                    nodeDefinitionMap[nodeType as keyof typeof nodeDefinitionMap]?.relationshipDefinitionSet.forEach(relationshipDefinition => {
                        const relationshipTypeKey = `${nextNode.nodeId}:${relationshipDefinition.type}:${nodeType}` as const
                        state.toNodePointerMap.has(relationshipTypeKey) || state.toNodePointerMap.set(
                            relationshipTypeKey, new Set<string>()
                        )
                    })
                })

                // Check if node is in any relationships in the case of direct deletion
                if (nextNode.delete) {
                    state.relationshipMap.forEach((relationship, relationshipKey) => {
                        if (relationshipKey.includes(nextNode.nodeId)) {
                            state.relationshipMap.delete(relationshipKey)
                            const direction = relationshipKey.split(':').findIndex(key => key === nextNode.nodeId) > 0 ? 'to' : 'from'
                            const [fromNodeId, relationshipType, toNodeId] = relationshipKey.split(':')
                            state[`${direction}NodePointerMap`].forEach((_, nodePointerKey) => {
                                if (nodePointerKey.includes(nextNode.nodeId)){
                                    state[`${direction}NodePointerMap`].delete(nodePointerKey)
                                }
                            })
                            const relationshipTypeKey = `${direction === 'to' ? fromNodeId : toNodeId}:${relationshipType}:${nextNode.nodeType}` as const
                            state[`${direction === 'to' ? 'from' : 'to'}NodePointerMap`].set(
                                relationshipTypeKey, 
                                produce(state[`${direction === 'to' ? 'from' : 'to'}NodePointerMap`].get(relationshipTypeKey)!, draft => {
                                    draft.delete(nextNode.nodeId)
                                })
                            )

                        }
                    })
                }

                if (!previousNode || !relationshipKey) return 'continue'
                // Set [tnid:rT]: Set<fnid> & [fnid:rT]: Set<tnid>
                relationshipKey.includes('->')
                    ? (
                        nextNode.detach || nextNode.delete
                            ? ( 
                                state.fromNodePointerMap.set(
                                    `${previousNode.nodeId}:${relationshipKey.split('-')[1]}:${nextNode.nodeType}`, 
                                    produce(state.fromNodePointerMap.get(`${previousNode.nodeId}:${relationshipKey.split('-')[1]}:${nextNode.nodeType}`)||new Set<string>(), draft => {
                                        draft.delete(nextNode.nodeId)
                                    })
                                ),
                                state.toNodePointerMap.set(
                                    `${nextNode.nodeId}:${relationshipKey.split('-')[1]}:${previousNode.nodeType}`, 
                                    produce(state.toNodePointerMap.get(`${nextNode.nodeId}:${relationshipKey.split('-')[1]}:${previousNode.nodeType}`)||new Set<string>(), draft => {
                                        draft.delete(previousNode.nodeId)
                                    })
                                )
                            )
                            : (
                                state.fromNodePointerMap.set(
                                    `${previousNode.nodeId}:${relationshipKey.split('-')[1]}:${nextNode.nodeType}`, 
                                    produce(state.fromNodePointerMap.get(`${previousNode.nodeId}:${relationshipKey.split('-')[1]}:${nextNode.nodeType}`) || new Set<string>(), draft => {
                                        draft.add(nextNode.nodeId)
                                    })
                                ),
                                state.toNodePointerMap.set(
                                    `${nextNode.nodeId}:${relationshipKey.split('-')[1]}:${previousNode.nodeType}`, 
                                    produce(state.toNodePointerMap.get(`${nextNode.nodeId}:${relationshipKey.split('-')[1]}:${previousNode.nodeType}`) || new Set<string>(), draft => {
                                        draft.add(previousNode.nodeId)
                                    })
                                )
                            )
                    )
                    // previous<-next
                    : (
                        nextNode.detach || nextNode.delete
                        ?  (
                            state.toNodePointerMap.set(
                                `${previousNode.nodeId}:${relationshipKey.split('-')[1]}:${nextNode.nodeType}`, 
                                produce(state.toNodePointerMap.get(`${previousNode.nodeId}:${relationshipKey.split('-')[1]}:${nextNode.nodeType}`)||new Set<string>(), draft => {
                                    draft.delete(nextNode.nodeId)
                                })
                            ),
                            state.fromNodePointerMap.set(
                                `${nextNode.nodeId}:${relationshipKey.split('-')[1]}:${previousNode.nodeType}`, 
                                produce(state.fromNodePointerMap.get(`${nextNode.nodeId}:${relationshipKey.split('-')[1]}:${previousNode.nodeType}`)||new Set<string>(), draft => {
                                    draft.delete(previousNode.nodeId)
                                })
                            )
                        )
                        : (
                            state.toNodePointerMap.set(
                                `${previousNode.nodeId}:${relationshipKey.split('-')[1]}:${nextNode.nodeType}`, 
                                produce(state.toNodePointerMap.get(`${previousNode.nodeId}:${relationshipKey.split('-')[1]}:${nextNode.nodeType}`) || new Set<string>(), draft => {
                                    draft.add(nextNode.nodeId)
                                })
                            ),
                            state.fromNodePointerMap.set(
                                `${nextNode.nodeId}:${relationshipKey.split('-')[1]}:${previousNode.nodeType}`, 
                                produce(state.fromNodePointerMap.get(`${nextNode.nodeId}:${relationshipKey.split('-')[1]}:${previousNode.nodeType}`) || new Set<string>(), draft => {
                                    draft.add(previousNode.nodeId)
                                })
                            )
                        )
                    )
                // Set [tnid:rT:fnid]
                relationshipKey.includes('->')
                    ? replace
                        ? state.relationshipMap.set(
                            `${previousNode.nodeId}:${relationshipKey.split('-')[1]}:${nextNode.nodeId}`, 
                            _.pick(
                                removeRelationshipEntries(nextNode) as GenericNodeShape,
                                ((nodeDefinitionMap[previousNode.nodeType as keyof typeof nodeDefinitionMap]
                                ?.relationshipDefinitionMap[relationshipKey.split('-')[1] as keyof (typeof nodeDefinitionMap[keyof typeof nodeDefinitionMap]['relationshipDefinitionMap'])]) as {stateSchema?: AnyZodObject})
                                ?.stateSchema?.keyof().options??''
                            )
                        )
                        : nextNode.detach || nextNode.delete
                            ? state.relationshipMap.delete(`${previousNode.nodeId}:${relationshipKey.split('-')[1]}:${nextNode.nodeId}`)
                            : state.relationshipMap.set(
                                `${previousNode.nodeId}:${relationshipKey.split('-')[1]}:${nextNode.nodeId}`, 
                                _.merge(
                                    state.relationshipMap.get(`${previousNode.nodeId}:${relationshipKey.split('-')[1]}:${nextNode.nodeId}`)??{}, 
                                    _.pick(
                                        removeRelationshipEntries(nextNode) as GenericNodeShape,
                                        ((nodeDefinitionMap[previousNode.nodeType as keyof typeof nodeDefinitionMap]
                                        ?.relationshipDefinitionMap[relationshipKey.split('-')[1] as keyof (typeof nodeDefinitionMap[keyof typeof nodeDefinitionMap]['relationshipDefinitionMap'])]) as {stateSchema?: AnyZodObject})
                                        ?.stateSchema?.keyof().options??''
                                    )
                                )
                            )
                    : replace 
                        ? state.relationshipMap.set(
                            `${nextNode.nodeId}:${relationshipKey.split('-')[1]}:${previousNode.nodeId}`, 
                            _.pick(
                                removeRelationshipEntries(nextNode) as GenericNodeShape,
                                ((nodeDefinitionMap[nextNode.nodeType as keyof typeof nodeDefinitionMap]
                                ?.relationshipDefinitionMap[relationshipKey.split('-')[1] as keyof (typeof nodeDefinitionMap[keyof typeof nodeDefinitionMap]['relationshipDefinitionMap'])]) as {stateSchema?: AnyZodObject})
                                ?.stateSchema?.keyof().options??''
                            )
                        )
                        : nextNode.detach || nextNode.delete
                            ? state.relationshipMap.delete(`${nextNode.nodeId}:${relationshipKey.split('-')[1]}:${previousNode.nodeId}`)
                            : state.relationshipMap.set(
                                `${nextNode.nodeId}:${relationshipKey.split('-')[1]}:${previousNode.nodeId}`, 
                                _.merge(
                                    state.relationshipMap.get(`${nextNode.nodeId}:${relationshipKey.split('-')[1]}:${previousNode.nodeId}`)??{}, 
                                    _.pick(
                                        removeRelationshipEntries(nextNode) as GenericNodeShape,
                                        ((nodeDefinitionMap[nextNode.nodeType as keyof typeof nodeDefinitionMap]
                                        ?.relationshipDefinitionMap[relationshipKey.split('-')[1] as keyof (typeof nodeDefinitionMap[keyof typeof nodeDefinitionMap]['relationshipDefinitionMap'])]) as {stateSchema?: AnyZodObject})
                                        ?.stateSchema?.keyof().options??''
                                    )
                                )
                            )
                return 'continue'
            }
        })
    })
}