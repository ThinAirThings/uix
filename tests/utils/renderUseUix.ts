import { ZodObject, ZodTypeAny } from "zod";
import { ConfiguredNodeDefinitionMap } from "../uix/generated/staticObjects";
import {AnySubgraphDefinition, DeepPartial, ExtractOutputTree, MergeInputTree, NodeState, SubgraphDefinition, SubgraphPathDefinition} from "@thinairthings/uix"
import { act, renderHook, waitFor } from "@testing-library/react";
import { useUix } from "../uix/generated/useUix";
import { FC, ReactNode } from "react";
import { expect } from "vitest";



export const renderUseUix = async <
    RootNodeType extends keyof ConfiguredNodeDefinitionMap,
    SubgraphIndex extends ({
        [UniqueIndex in ConfiguredNodeDefinitionMap[RootNodeType]['uniqueIndexes'][number]]?: string
    }),
    SubgraphDefinitionRef extends AnySubgraphDefinition,
    Data extends 
        | (MergeInputTree<ConfiguredNodeDefinitionMap, RootNodeType>) 
        | ExtractOutputTree<ConfiguredNodeDefinitionMap, SubgraphDefinitionRef, RootNodeType>
    = ExtractOutputTree<ConfiguredNodeDefinitionMap, SubgraphDefinitionRef, RootNodeType>&MergeInputTree<ConfiguredNodeDefinitionMap, RootNodeType> 
>({
    rootNodeIndex,
    defineSubgraph,
    modifySchema,
    initializeDraft
}: {    
    rootNodeIndex: (({
        nodeType: RootNodeType
    }) & SubgraphIndex) | undefined,
    defineSubgraph?: (subgraph: SubgraphDefinition<
        ConfiguredNodeDefinitionMap, 
        [SubgraphPathDefinition<
            ConfiguredNodeDefinitionMap,
            RootNodeType,
            []
        >]>
    ) => SubgraphDefinitionRef,
    modifySchema?: (stateSchema: ConfiguredNodeDefinitionMap[RootNodeType]['stateSchema']) => ZodObject<{
        [K in keyof NodeState<ConfiguredNodeDefinitionMap[RootNodeType]>]: ZodTypeAny
    }>,
    initializeDraft?: (
        data: ExtractOutputTree<ConfiguredNodeDefinitionMap, SubgraphDefinitionRef, RootNodeType>, 
        initialize: <T extends MergeInputTree<ConfiguredNodeDefinitionMap, RootNodeType>>(freeze: T) => T
    ) => Data
}, wrapper: FC<{children: ReactNode}>) => {
    const {result, rerender} = renderHook(() => useUix( {
        rootNodeIndex,
        defineSubgraph,
        modifySchema,
        initializeDraft
    }), { wrapper })
    await waitFor(() => {expect(result.current.isSuccess).toBe(true)}, {timeout: 3000, interval: 1000})
    const updateDraft = async (updater: Parameters<typeof result.current.updateDraft>[0]) => {
        act(() => {result.current.updateDraft(updater)})
        act(() => {result.current.commitDraft()})
        rerender()
        await waitFor(() => {expect(result.current.isCommitPending).toBe(false)}, {timeout: 3000, interval: 1000})
        await waitFor(() => {expect(result.current.isPending).toBe(false)}, {timeout: 3000, interval: 1000})
    }
    return {result, rerender, updateDraft}
}