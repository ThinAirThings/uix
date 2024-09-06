import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnyNodeDefinitionMap, GenericNodeShape } from "../../definitions/NodeDefinition";
import { AnySubgraphDefinition, SubgraphDefinition } from "../../definitions/SubgraphDefinition";
import { SubgraphPathDefinition } from "../../definitions/SubgraphPathDefinition";
import { ExtractOutputTree } from "../../types";
import { NodeKey } from "../../types/NodeKey";
import { QueryError, Result } from "../../types/Result";
import { useCallback, useMemo } from "react";
import { cycleSubgraphSubscriptions } from "./cycleSubgraphSubscriptionSet";
import { mergeSubgraphToGraphStore } from "./mergeSubgraphToGraphStore";
import { extractSubgraphFactory } from "../../fns/extractSubgraphFactory";





export const useGraphFactory = <
    NodeDefinitionMap extends AnyNodeDefinitionMap
>(
    nodeDefinitionMap: NodeDefinitionMap
) => <
    RootNodeType extends keyof NodeDefinitionMap,
    SubgraphDefinitionRef extends AnySubgraphDefinition,
    Data = ExtractOutputTree<NodeDefinitionMap, SubgraphDefinitionRef, RootNodeType>
>({
    rootNodeIndex,
    defineSubgraph,
    select,
    ...queryOptions
}: {
    rootNodeIndex: NodeKey<NodeDefinitionMap, RootNodeType>
    defineSubgraph?: (subgraph: SubgraphDefinition<
        NodeDefinitionMap, 
        [SubgraphPathDefinition<
            NodeDefinitionMap,
            RootNodeType,
            []
        >]>
    ) => SubgraphDefinitionRef
    select?: (data: ExtractOutputTree<NodeDefinitionMap, SubgraphDefinitionRef, RootNodeType>) => Data
} & Omit<Parameters<typeof useQuery<
    ExtractOutputTree<NodeDefinitionMap, SubgraphDefinitionRef, RootNodeType>,
    QueryError<any>,
    Data,
    readonly [{
        readonly nodeType: RootNodeType;
        readonly nodeId: string;
    }, ...SubgraphDefinitionRef[]]
>>[0], 'queryKey' | 'queryFn' | 'select'>) => {
    const queryClient = useQueryClient()
    const selectCallback = useCallback(
        (data: ExtractOutputTree<NodeDefinitionMap, SubgraphDefinitionRef, RootNodeType>) => select!(data)
    , [select])
    const subgraphDefinition = defineSubgraph ? defineSubgraph(new SubgraphDefinition(nodeDefinitionMap, [new SubgraphPathDefinition(
        nodeDefinitionMap,
        rootNodeIndex.nodeType,
        []
    )])) : undefined
    const queryKey = useMemo(() => [{
        nodeType: rootNodeIndex.nodeType,
        nodeId: rootNodeIndex.nodeId
    }, ...!subgraphDefinition ? [] : [subgraphDefinition.serialize()]] as const, 
    [rootNodeIndex.nodeId, rootNodeIndex.nodeType, subgraphDefinition])
    // const subgraphRef = useRef<GenericNodeShape | undefined>(undefined)
    const queryOutput = useQuery({
        // The data structure being represented here is a map of subgraphs where the key is the serialized query input
        // The query input defines the subgraph
        queryKey: queryKey,
        queryFn: rootNodeIndex ? async ({queryKey: subgraphKey}) => {
            // Get Subgraph
            const {data, error} = await fetch(`https://uix.thinair.cloud/v0/extract`, {
                method: 'POST',
                body: JSON.stringify(subgraphKey)
            }).then(res => res.json()) as Result<
                ExtractOutputTree<NodeDefinitionMap, SubgraphDefinitionRef, RootNodeType>,
                QueryError<any>
            >
            if (error) throw new QueryError(error)
            mergeSubgraphToGraphStore({
                nodeDefinitionMap,
                data: data as unknown as GenericNodeShape & {detach?: boolean, delete?: boolean},
            })
            return data
        } : skipToken,
        select: (subgraph) => {
            cycleSubgraphSubscriptions({
                nodeDefinitionMap,
                queryClient,
                subgraphKey: queryKey,
                subgraph: subgraph as GenericNodeShape
            })
            return select ? selectCallback(subgraph) : subgraph as Data
        },
        ...queryOptions
    })
    return queryOutput
}