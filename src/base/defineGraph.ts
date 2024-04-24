import { TypeOf, ZodObject } from "zod"
import { v4 as uuidv4 } from 'uuid'
import { UixNode } from "../types/UixNode"
import { defineNode } from "./defineNode"
import { defineRelationship } from "./defineRelationship"
import { NodeKey } from "../types/NodeKey"








export type OmitNodeContants<T extends UixNode<any, any>> = Omit<T, 'nodeType' | 'nodeId' | 'createdAt' | 'updatedAt'>

export const defineGraph = <
    N extends readonly ReturnType<typeof defineNode<any, any, any>>[]
>({
    nodeDefinitions,
}: {
    nodeDefinitions: N,
}) => {
    const nodeMap = new Map<string, { nodeId: string, nodeType: string, createdAt: string }>
    return {
        nodeDefinitions,
        createNode: <
            T extends N[number]['nodeType']
        >(
            nodeType: T,
            initialState: TypeOf<(N[number] & { nodeType: T })['stateDefinition']>
        ): Promise<UixNode<T, TypeOf<(N[number] & { nodeType: T })['stateDefinition']>>> => {
            const node = {
                nodeType,
                nodeId: uuidv4(),
                createdAt: new Date().toISOString(),
                ...initialState
            }
            nodeMap.set(node.nodeId, node)
            return node
        },
        getNode: <
            T extends N[number]['nodeType']
        >(
            { nodeType, nodeId }: NodeKey<T>
        ) => {
            const node = nodeMap.get(nodeId)
            return node as UixNode<T, TypeOf<(N[number] & { nodeType: T })['stateDefinition']>>
        },
        updateNode: <
            T extends N[number]['nodeType']
        >(
            { nodeType, nodeId }: NodeKey<T>,
            state: Partial<TypeOf<(N[number] & { nodeType: T })['stateDefinition']>>
        ) => {
            const node = nodeMap.get(nodeId)
            if (!node) throw new Error('Node not found')
            nodeMap.set(nodeId, {
                ...node,
                ...state
            })
            return nodeMap.get(nodeId) as UixNode<T, TypeOf<(N[number] & { nodeType: T })['stateDefinition']>>
        },
        createRelationship: <
            FN extends NodeKey<N[number]['nodeType']>,
        >(
            fromNode: FN,
            relationshipType: (N[number] & { nodeType: FN['nodeType'] })['relationships'][number],
            toNode: NodeKey<N[number]['nodeType']>
        ) => {
            return {
                fromNode,
                relationshipType,
                toNode
            }
        }
    }
}