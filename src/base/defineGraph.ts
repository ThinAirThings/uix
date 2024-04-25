import { TypeOf, ZodObject } from "zod"
import { v4 as uuidv4 } from 'uuid'
import { UixNode } from "../types/UixNode"
import { defineNode } from "./defineNode"
import { GraphLayer } from "../types/Graph"


export type OmitNodeContants<T extends UixNode<any, any>> = Omit<T, 'nodeType' | 'nodeId' | 'createdAt' | 'updatedAt'>

export const defineGraph = <
    N extends readonly ReturnType<typeof defineNode<any, any>>[],
    R extends { [K in N[number]['nodeType']]?: {
        [R: Uppercase<string>]: {
            toNodeType: readonly N[number]['nodeType'][]
            stateDefinition?: ZodObject<any>
        }
    } },
    UIdx extends {
        [T in N[number]['nodeType']]?: readonly (keyof TypeOf<(N[number] & { nodeType: T })['stateDefinition']>)[]
    },
>({
    nodeDefinitions,
    relationshipDefinitions,
    uniqueIndexes
}: {
    nodeDefinitions: N,
    relationshipDefinitions: R
    uniqueIndexes: UIdx
}): Pick<GraphLayer<N, R, UIdx>, 'nodeDefinitions' | 'relationshipDefinitions' | 'uniqueIndexes' | 'createNode' | 'createRelationship'> => {
    return {
        nodeDefinitions,
        relationshipDefinitions,
        uniqueIndexes,
        createNode: (
            nodeType,
            initialState
        ) => {
            const node = {
                nodeType,
                nodeId: uuidv4(),
                createdAt: new Date().toISOString(),
                ...initialState
            }
            return node
        },
        createRelationship: (
            fromNode,
            relationshipType,
            toNode,
            ...[state]
        ) => {
            return null as any
        } 
    }
}