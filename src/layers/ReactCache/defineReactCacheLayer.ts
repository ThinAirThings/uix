import { NodeDefinition, defineNode } from "@/src/base/defineNode";
import { TypeOf, ZodObject } from "zod";
import { GraphLayer } from "@/src/types/GraphLayer";
import { Ok } from "@/src/types/Result";
import { create, createStore, useStore } from "zustand";
import { UixNode } from "@/src/types/UixNode";
import { enableMapSet, Draft, produce } from 'immer'
import { immer } from "zustand/middleware/immer";
import { useImmer } from "@thinairthings/use-immer";
import { OmitNodeConstants } from "@/src/base/defineBaseGraph";
import { useEffect } from "react";




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
        node?: Node,
        updateAction?: (...args: any[]) => Promise<any>
    ) => ReturnType<typeof useImmer<Node extends UixNode<T, TypeOf<(N[number] & { nodeType: T })['stateDefinition']>>
        ? (Omit<TypeOf<(N[number] & { nodeType: T })['stateDefinition']>, keyof TypeOf<(N[number] & { nodeType: T })['stateDefaults']>>
            & TypeOf<(N[number] & { nodeType: T })['stateDefaults']>)
        : TypeOf<(N[number] & { nodeType: T })['stateDefaults']>
    >>

} => {
    type ReactCache = {
        nodeMap: Map<string, UixNode<any, any>>
    } & Pick<
        GraphLayer<N, R, E, UIdx, PreviousLayers | 'ReactCache'>,
        'createNode' | 'updateNode'
    >
    // const useNodeStore = create()()
    return {
        ...graph,
        useNodeState: (nodeType, node, updater) => {
            const [nodeState, updateNodeState] = useImmer(graph.getNodeDefinition(nodeType).stateDefaults.parse(node ?? {}))
            useEffect(() => {
                return () => {
                    (async () => {
                        console.log("RUNNNING")
                        await updater?.(node, nodeState)
                    })()
                }
            }, [nodeState, updater])
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