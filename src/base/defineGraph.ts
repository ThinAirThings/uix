import { TypeOf, ZodObject } from "zod"
import { v4 as uuidv4 } from 'uuid'
import { UixNode } from "../types/UixNode"
import { defineNode } from "./defineNode"
import { GraphLayer } from "../types/Graph"
import { Ok } from 'ts-results';

export type OmitNodeContants<T extends UixNode<any, any>> = Omit<T, 'nodeType' | 'nodeId' | 'createdAt' | 'updatedAt'>



export const defineGraph = <
    N extends readonly ReturnType<typeof defineNode<any, any>>[],
    R extends readonly {
        relationshipType: Uppercase<string>
        stateDefinition?: ZodObject<any>
    }[],
    E extends { [NT in (N[number]['nodeType'])]?: {
        [RT in R[number]['relationshipType']]?: readonly N[number]['nodeType'][]
    } },
    UIdx extends {
        [T in N[number]['nodeType']]?: readonly (keyof TypeOf<(N[number] & { nodeType: T })['stateDefinition']>)[]
    },
>({
    nodeDefinitions,
    relationshipDefinitions,
    edgeDefinitions,
    uniqueIndexes
}: {
    nodeDefinitions: N,
    relationshipDefinitions: R
    edgeDefinitions: E
    uniqueIndexes: UIdx
}): Pick<
    GraphLayer<N, R, E, UIdx>,
    | 'nodeDefinitions'
    | 'relationshipDefinitions'
    | 'edgeDefinitions'
    | 'uniqueIndexes'
    | 'createNode'
    | 'getDefinition'
    | 'getNodeType'
> => {
    const definitionMap = new Map<string, ReturnType<typeof defineNode<any, any>>>()
    nodeDefinitions.forEach(definition => {
        definitionMap.set(definition.nodeType, definition)
    })
    return {
        nodeDefinitions,
        relationshipDefinitions,
        edgeDefinitions,
        uniqueIndexes,
        createNode: async (
            nodeType,
            initialState
        ) => {
            const node = {
                nodeType,
                nodeId: uuidv4(),
                createdAt: new Date().toISOString(),
                ...initialState
            }
            return new Ok(node)
        },
        getDefinition: (nodeType) => {
            return definitionMap.get(nodeType)!
        },
        getNodeType: (nodeType) => {
            throw new Error(`getNodeType should never be called in the runtime. It's a type-level utlity function.`)
            return null as unknown as UixNode<
                typeof nodeType,
                TypeOf<(N[number] & { nodeType: typeof nodeType })['stateDefinition']
                >>
        }

    }
}