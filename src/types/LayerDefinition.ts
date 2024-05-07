import { TypeOf, ZodObject } from "zod"
import { defineNode } from "../base/defineNode"
import { GraphLayer } from "./GraphLayer"


export type LayerDefinition<
    LayerName extends Capitalize<string>,
    Configuration
> = <
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
    configuration: Configuration
) => GraphLayer<N, R, E, UIdx, PreviousLayers | LayerName>