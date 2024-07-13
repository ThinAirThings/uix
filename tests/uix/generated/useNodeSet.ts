
'use client'
import {
    NodeKey,
    NodeSetParentTypes,
    NodeSetChildNodeTypes,
    NodeShape,
    NodeState
} from '@thinairthings/uix'
import { ConfiguredNodeTypeMap } from './staticObjects'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { NodeSetQueryOptions } from './queryOptions'
import { createNode } from './functionModule'
import { v4 as uuid } from 'uuid'

export const useNodeSet = <
    ParentNodeType extends NodeSetParentTypes<ConfiguredNodeTypeMap>,
    ChildNodeType extends NodeSetChildNodeTypes<ConfiguredNodeTypeMap, ParentNodeType>,
    Data = NodeShape<ConfiguredNodeTypeMap[ChildNodeType]>[],
>({
    parentNodeKey,
    childNodeType,
    select
}:{    
    parentNodeKey: NodeKey<ConfiguredNodeTypeMap, ParentNodeType>,
    childNodeType: `${ChildNodeType}`,
    select?: (data: NodeShape<ConfiguredNodeTypeMap[ChildNodeType]>[]) => Data
}) => {
    const queryOptions = NodeSetQueryOptions({parentNodeKey, childNodeType, select})
    const queryClient = useQueryClient()
    const { data, error } = useQuery(queryOptions)
    const createNodeMutation = useMutation({
        mutationFn: async ({
            nodeId,
            createdAt,
            updatedAt,
            nodeType,
            ...initialState
        }: NodeShape<ConfiguredNodeTypeMap[ChildNodeType]>) => {
            return await createNode({
                parentNodeKeys: [parentNodeKey], 
                childNodeType, 
                initialState: initialState as NodeState<ConfiguredNodeTypeMap[ChildNodeType]>,
                providedNodeId: nodeId,
            })
        },
        onMutate: async (newNode) => {
            await queryClient.cancelQueries({queryKey: queryOptions.queryKey})
            const previousData = queryClient.getQueryData(queryOptions.queryKey)
            queryClient.setQueryData(queryOptions.queryKey, oldData => {
                if (!oldData) return [newNode]
                return [...oldData, newNode]
            })
            return { previousData }
        },
        onError: (err, newData, context) => {
            queryClient.setQueryData(queryOptions.queryKey, context?.previousData)
        },
        onSuccess: () => queryClient.invalidateQueries({
            queryKey: [parentNodeKey.nodeType, parentNodeKey.nodeId, childNodeType]
        })
    })
    return {
        data, error, createNode: (...[initialState, handlers]: [
            NodeState<ConfiguredNodeTypeMap[ChildNodeType]>,
            Parameters<typeof createNodeMutation['mutate']>[1]?
        ]) => createNodeMutation.mutateAsync({
            nodeId: uuid(),
            createdAt: new Date().getTime(),
            updatedAt: new Date().getTime(),
            nodeType: childNodeType,
            ...initialState
        }, handlers)
    }
}
