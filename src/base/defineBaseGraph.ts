import { TypeOf, ZodObject } from "zod"
import { v4 as uuidv4 } from 'uuid'
import { UixNode } from "../types/UixNode"
import { NodeDefinition, defineNode } from "./defineNode"
import { GraphLayer } from "../types/GraphLayer"
import { Ok } from "../types/Result"

export type OmitNodeConstants<T extends UixNode<any, any>> = Omit<T, 'nodeType' | 'nodeId' | 'createdAt' | 'updatedAt'>


export const defineBaseGraph = <
    N extends readonly NodeDefinition<any, any, any, any>[],
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
}): GraphLayer<N, R, E, UIdx> => {
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
            return Ok(node)
        },
        getNodeDefinition: (nodeType) => {
            return definitionMap.get(nodeType)!
        },
    } as GraphLayer<N, R, E, UIdx>
}