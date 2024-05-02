import { defineNode } from "@/src/base/defineNode";
import { TypeOf, ZodObject } from "zod";
import { GraphLayer } from "@/src/types/GraphLayer";
import { Ok } from "@/src/types/Result";
import { createStore, useStore } from "zustand";
import { UixNode } from "@/src/types/UixNode";
import { enableMapSet, Draft, produce } from 'immer'
import { immer } from "zustand/middleware/immer";

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
): GraphLayer<N, R, E, UIdx, PreviousLayers | 'ReactCache'> & {
    useNodeState: <
        T extends N[number]['nodeType'],
        R = (Awaited<ReturnType<typeof graph.getNode<T>>> & { ok: true })['val']
    >(
        nodeType: Parameters<typeof graph.getNode<T>>[0],
        nodeId: string,
        selector?: ((node: (Awaited<ReturnType<typeof graph.getNode<T>>> & { ok: true })['val']) => R)
    ) => [R, (state: Draft<R>) => void]
    // useRelatedTo: <
    //     FromNodeType extends keyof E,
    //     RelationshipType extends ((keyof E[FromNodeType]) & R[number]['relationshipType']),
    //     ToNodeType extends E[FromNodeType][RelationshipType] extends readonly any[] ? E[FromNodeType][RelationshipType][number] : never
    // >(
    //     ...args: Parameters<typeof graph.getRelatedTo<FromNodeType, RelationshipType, ToNodeType>>
    // ) => ReturnType<typeof useQuery<
    //     (Awaited<ReturnType<typeof graph.getRelatedTo<FromNodeType, RelationshipType, ToNodeType>>> & { ok: true })['val']
    // >>
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
    const thisGraphLayer: ReturnType<typeof defineReactCacheLayer<N, R, E, UIdx, PreviousLayers | 'ReactCache'>> = {
        ...graph,
        useNodeState: (nodeType, nodeId, selector) => {
            const nodeState = useStore(nodeStore, (store) => {
                return selector
                    ? selector(store.nodeMap.get(nodeId)! as (Awaited<ReturnType<typeof graph.getNode<typeof nodeType>>> & { ok: true })['val'])
                    : store.nodeMap.get('test')! as ReturnType<NonNullable<typeof selector>>
            })
            const updateNodeState = (updater: (draft: Draft<typeof nodeState>) => void) => nodeStore.setState(state => {
                state.nodeMap.set(nodeId, produce(nodeState, updater) as any)
            })
            return [nodeState, updateNodeState] as any
        },
        // You need this to force the user to use getNode after creation. If you don't, then they could be stuck with a null value after creation.
        createNode: async (nodeType, initialState) => {
            return await nodeStore.getState().createNode(nodeType, initialState)
        },
        updateNode: async (nodeKey, state) => {
            return await nodeStore.getState().updateNode(nodeKey, state)
        },
        deleteNode: async (nodeKey) => {
            return null as any
        },
        createRelationship: async (fromNode, relationshipType, toNode, ...args) => {
            return null as any
        },
    }
    return thisGraphLayer
}