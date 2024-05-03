import { NodeDefinition, defineNode } from "@/src/base/defineNode";
import { TypeOf, ZodObject } from "zod";
import { GraphLayer } from "@/src/types/GraphLayer";
import { Ok } from "@/src/types/Result";
import { createStore, useStore } from "zustand";
import { UixNode } from "@/src/types/UixNode";
import { enableMapSet, Draft, produce } from 'immer'
import { immer } from "zustand/middleware/immer";
import { useImmer } from "@thinairthings/use-immer";
import { OmitNodeConstants } from "@/src/base/defineBaseGraph";



enableMapSet()
export const defineReactCacheLayer = <
    N extends readonly ReturnType<typeof defineNode<any, any>>[],
    R extends readonly {
        relationshipType: Uppercase<string>
        uniqueFromNode?: boolean
        stateDefinition?: ZodObject<any>
    }[],
    E extends { [NT in (N[number]['nodeType'])]?: {
        [RT in R[number]['relationshipType']]?: readonly N[number]['nodeType'][]
    } },
    UIdx extends {
        [T in N[number]['nodeType']]?: readonly (keyof TypeOf<(N[number] & { nodeType: T })['stateDefinition']>)[]
    },
    PreviousLayers extends Capitalize<string>
>(
    graph: GraphLayer<N, R, E, UIdx, PreviousLayers>,
): GraphLayer<N, R, E, UIdx, PreviousLayers> & {
    useNodeState: <
        T extends N[number]['nodeType'],
        Node extends UixNode<T, TypeOf<(N[number] & { nodeType: T })['stateDefinition']>> | undefined = undefined
    >(
        nodeType: T,
        node?: Node
    ) => ReturnType<typeof useImmer<Node extends UixNode<T, TypeOf<(N[number] & { nodeType: T })['stateDefinition']>>
        ? TypeOf<(N[number] & { nodeType: T })['stateDefinition']>
        : TypeOf<(N[number] & { nodeType: T })['stateDefaults']>
    >>
} => {

    type ReactCache = {
        nodeMap: Map<string, UixNode<any, any>>
    } & Pick<
        GraphLayer<N, R, E, UIdx, PreviousLayers | 'ReactCache'>,
        'createNode' | 'updateNode'
    >
    const nodeStore = createStore<ReactCache>()(
        immer(
            (set) => ({
                nodeMap: new Map(),
                createNode: async (nodeType, initialState) => {
                    const createNodeResult = await graph.createNode(nodeType, initialState)
                    if (!createNodeResult.ok) return createNodeResult
                    const node = createNodeResult.val
                    set((state) => {
                        state.nodeMap.set(node.nodeId, node)
                    })
                    return Ok(node)
                },
                updateNode: async (nodeKey, state) => {
                    set((state) => {
                        state.nodeMap.set(nodeKey.nodeId, {
                            ...state.nodeMap.get(nodeKey.nodeId)!,
                            ...state
                        })
                    })
                    return await graph.updateNode(nodeKey, state)
                },
            })
        )
    )
    return {
        ...graph,
        useNodeState: (nodeType, node) => {
            const [nodeState, updateNodeState] = useImmer(graph.getNodeDefinition(nodeType).stateDefaults.parse(node ?? {}))
            return [nodeState, updateNodeState] as any
        },
    }
    // const thisGraphLayer: ReturnType<typeof defineReactCacheLayer<N, R, E, UIdx, PreviousLayers | 'ReactCache'>> = {
    //     ...graph,
    //     useNodeState: (node, selector) => {
    //         const [nodeState, updateNodeState] = useImmer(graph.getNodeDefinition(node.nodeType).stateDefinition.parse(node))
    //         return [nodeState, updateNodeState] as any
    //     },
    // // You need this to force the user to use getNode after creation. If you don't, then they could be stuck with a null value after creation.
    // createNode: async (nodeType, initialState) => {
    //     return await nodeStore.getState().createNode(nodeType, initialState)
    // },
    // updateNode: async (nodeKey, state) => {
    //     return await nodeStore.getState().updateNode(nodeKey, state)
    // },
    // deleteNode: async (nodeKey) => {
    //     return null as any
    // },
    // createRelationship: async (fromNode, relationshipType, toNode, ...args) => {
    //     return null as any
    // },
    // }
    // return thisGraphLayer
}