
import {AnyExtractionSubgraph, ExtractionSubgraph, ExtractionOptions, RootExtractionNode, QueryError, NodeShape, SubgraphTree, RelationshipShape, GenericNodeKey} from "@thinairthings/uix"
import { useQuery, useQueryClient} from "@tanstack/react-query"
import { createImmerState } from "@thinairthings/utilities";
import { ConfiguredNodeDefinitionMap, nodeDefinitionMap, NodeKey } from "../uix/generated/staticObjects";
import { extractSubgraph } from "../uix/generated/functionModule";
import {makeAutoObservable} from 'mobx'
import { useEffect, useRef } from "react";
const subgraphStore = createImmerState({
    nodeMap: new Map<string, NodeShape<ConfiguredNodeDefinitionMap[keyof ConfiguredNodeDefinitionMap]>>(),
})

export const useSubgraph = <
    NodeType extends keyof ConfiguredNodeDefinitionMap,
    ReferenceType extends 'nodeType' | 'nodeIndex' = 'nodeIndex',
    TypedSubgraph extends AnyExtractionSubgraph | undefined = undefined,
    // Data = ReferenceType extends 'nodeIndex'
    // ? TypedSubgraph extends AnyExtractionSubgraph
    //     ? NodeShape<ConfiguredNodeDefinitionMap[NodeType]> & SubgraphTree<ConfiguredNodeDefinitionMap, TypedSubgraph>
    //     : NodeShape<ConfiguredNodeDefinitionMap[NodeType]>
    // : TypedSubgraph extends AnyExtractionSubgraph
    //     ? (NodeShape<ConfiguredNodeDefinitionMap[NodeType]> & SubgraphTree<ConfiguredNodeDefinitionMap, TypedSubgraph>)[]
    //     : NodeShape<ConfiguredNodeDefinitionMap[NodeType]>[]
>(params: (({
    nodeType: NodeType
}) & (
        ReferenceType extends 'nodeType'
        ? ({
            referenceType: `${ReferenceType}`
            options?: ExtractionOptions
        }) : ({
            referenceType: ReferenceType
            indexKey: ConfiguredNodeDefinitionMap[NodeType]['uniqueIndexes'][number]
            indexValue: string
        })
    ) & ({
        subgraphSelector?: (subgraph: ExtractionSubgraph<ConfiguredNodeDefinitionMap, `n_0_0`, readonly [
            RootExtractionNode<ConfiguredNodeDefinitionMap, NodeType>
        ]>) => TypedSubgraph
        // selector?: (data: ReferenceType extends 'nodeIndex'
        //     ? TypedSubgraph extends AnyExtractionSubgraph
        //         ? NodeShape<ConfiguredNodeDefinitionMap[NodeType]> & SubgraphTree<ConfiguredNodeDefinitionMap, TypedSubgraph>
        //         : NodeShape<ConfiguredNodeDefinitionMap[NodeType]>
        //     : TypedSubgraph extends AnyExtractionSubgraph
        //         ? (NodeShape<ConfiguredNodeDefinitionMap[NodeType]> & SubgraphTree<ConfiguredNodeDefinitionMap, TypedSubgraph>)[]
        //         : NodeShape<ConfiguredNodeDefinitionMap[NodeType]>[]) => Data
    }))
) => {
    type SubgraphType = ReferenceType extends 'nodeIndex'
        ? TypedSubgraph extends AnyExtractionSubgraph
            ? NodeShape<ConfiguredNodeDefinitionMap[NodeType]> & SubgraphTree<ConfiguredNodeDefinitionMap, TypedSubgraph>
            : NodeShape<ConfiguredNodeDefinitionMap[NodeType]>
        : TypedSubgraph extends AnyExtractionSubgraph
            ? (NodeShape<ConfiguredNodeDefinitionMap[NodeType]> & SubgraphTree<ConfiguredNodeDefinitionMap, TypedSubgraph>)[]
            : NodeShape<ConfiguredNodeDefinitionMap[NodeType]>[]

    const subgraphRef = useRef<SubgraphType>()
    type UixNode<T extends SubgraphType> = T & {
        update: "Dan"
        FDSAFADSFSAFSD: string
    }
    type UixClassConstructor = {
        new <T extends SubgraphType>(node: T): UixNode<T>
    }
    const UixNode = class UixNode<
        T extends GenericNodeKey
    > {
        constructor(node:T){
            Object.assign(this, node)
        }
    } as UixClassConstructor
    const uixSubgraphRef = useRef<UixNode<SubgraphType>>()
    const { data: subgraph, error, isPending, isSuccess } = useQuery({
        queryKey: [
            params, 
            // params.subgraphSelector?.(ExtractionSubgraph.create(nodeDefinitionMap, params.nodeType))?.getQueryTree()
        ],
        //@ts-ignore
        queryFn: async () => {
            console.log("RUNNING QUERY")
            const result = await extractSubgraph(params) 
            if (result.error) throw new QueryError(result.error)
            // Create queryKeyTree 
            const subgraph = result.data as SubgraphType
            subgraphRef.current = subgraph
            return subgraph
        },
        // select: params.selector
    })
    // Create State Tree
    useEffect(() => {
        if (!subgraph) return

        const convertToUixNode = <T extends SubgraphType>(
            previousNodeRef: T,
            currentNodeRef:T,
            currentUixNode?: UixNode<T>
        ) => {
            if ((previousNodeRef === currentNodeRef) && currentUixNode) return currentUixNode
            // Recursively convert related nodes if they exist
            const uixNode = new UixNode(currentNodeRef)
            Object.keys(uixNode).forEach(key => {
                if (key.includes('<-') || key.includes('->')) {
                    console.log("Here")
                    if (Array.isArray(uixNode[key])) {
                        uixNode[key] = uixNode[key].map((node, index) => convertToUixNode(
                            previousNodeRef[key][index], 
                            currentNodeRef[key][index], 
                            currentUixNode ? currentUixNode[key][index] : undefined
                        ))
                    } else {
                        uixNode[key] = convertToUixNode(previousNodeRef[key], currentNodeRef[key], currentUixNode ? currentUixNode[key] : undefined)
                    }
                }
            })
            return uixNode
        }
        const uixSubgraph = convertToUixNode(subgraphRef.current!, subgraph!, uixSubgraphRef.current)
        uixSubgraphRef.current = uixSubgraph
    }, [subgraph])
    return {
        subgraph,
        uixSubgraph: uixSubgraphRef.current,
        error,
        isPending,
        isSuccess
    }
}

type UixNode<T extends GenericNodeKey> = T & {
    update: "Dan"
}
type UixClassConstructor = {
    new <T extends GenericNodeKey>(node: T): UixNode<T>
}
export const UixNode = class UixNode<
    T extends GenericNodeKey
> {
    constructor(node:T){
        Object.assign(this, node)
    }
} as UixClassConstructor

export const convertToUixNode = <T extends GenericNodeKey>(
    previousNodeRef: T,
    currentNodeRef:T,
    currentUixNode?: UixNode<T>
) => {
    if ((previousNodeRef === currentNodeRef) && currentUixNode) return currentUixNode
    // Recursively convert related nodes if they exist
    const uixNode = new UixNode(currentNodeRef)
    Object.keys(uixNode).forEach(key => {
        if (key.includes('<-') || key.includes('->')) {
            console.log("Here")
            if (Array.isArray(uixNode[key])) {
                uixNode[key] = uixNode[key].map((node, index) => convertToUixNode(
                    previousNodeRef[key][index], 
                    currentNodeRef[key][index], 
                    currentUixNode ? currentUixNode[key][index] : undefined
                ))
            } else {
                uixNode[key] = convertToUixNode(previousNodeRef[key], currentNodeRef[key], currentUixNode ? currentUixNode[key] : undefined)
            }
        }
    })
    return uixNode
}

const convertToTree = <T extends GenericNodeKey>(
    previousSubgraphRef: T,
    currentSubgraphRef:T,
    currentUixSubgraphRef: UixNode<T>
) => {
    if (previousSubgraphRef === currentSubgraphRef) return currentUixSubgraphRef
    // Recursively convert related nodes if they exist
    return convertToUixNode(previousSubgraphRef, currentSubgraphRef, currentUixSubgraphRef)
}


