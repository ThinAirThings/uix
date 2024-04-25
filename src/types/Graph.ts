import { TypeOf, ZodObject, ZodRawShape, z } from "zod"
import { defineNode } from "../base/defineNode"
import { NodeKey } from "./NodeKey"



type ThisGraph = Graph<[
    ReturnType<typeof defineNode< 'User', ReturnType<typeof z.object<{
        name: ReturnType<typeof z.string>
    }>>>>,
    ReturnType<typeof defineNode< 'Post', ReturnType<typeof z.object<{
        name: ReturnType<typeof z.string>
    }>>>>,
    ReturnType<typeof defineNode< 'Company', ReturnType<typeof z.object<{
        name: ReturnType<typeof z.string>
    }>>>>
], {
    'User': {
        'HAS_POST': {
            toNodeType: ['Post']
        }
    }
}, {
    'User': ['name'],
    'Post': ['name'],
    'Company': ['name']
}>


type Thing = ThisGraph['createRelationship']
const thing = null as unknown as Thing
thing({ nodeType: 'User', nodeId: '123' }, 'HAS_POST', 'Post')
// const fn: Thing = (fromNode, relationshipType, toNode, val) => {
//     console.log(fromNode, relationshipType, toNode)
// }

// fn({ nodeType: 'User', nodeId: '123' }, 'HAS_POST', 'Post')
export type Graph<
    N extends readonly ReturnType<typeof defineNode< any, any>>[],
    R extends {
        [K in N[number]['nodeType']]?: {
            [R: Uppercase<string>]: {
                toNodeType: readonly N[number]['nodeType'][]
                stateDefinition?: ZodObject<any>
            }
        }
    },
    UIdx extends {
        [T in N[number]['nodeType']]?: readonly (keyof TypeOf<(N[number] & { nodeType: T })['stateDefinition']>)[]
    }
> = {
    createRelationship: <
        NT extends N[number]['nodeType'],
        RT extends (keyof (R[NT & string]) & string),
    >(
        fromNode: NodeKey<NT>,
        relationshipType: RT,
        toNode: NodeKey<R[NT][RT] extends { toNodeType: readonly Capitalize<string>[] } ? R[NT][RT]['toNodeType'][number] : Capitalize<string>>,
        ...[state]: (R[NT][RT] extends { stateDefinition: ZodObject<any> } ? R[NT][RT]['stateDefinition'] : never) extends ZodObject<ZodRawShape>
            ? [TypeOf<R[NT][RT] extends { stateDefinition: ZodObject<any> } ? R[NT][RT]['stateDefinition'] : ZodObject<any>>]
            : []
    ) => void
    nodeDefinitions: N,
    relationshipDefinitions: R,
    // createNode: <
    //     T extends N[number]['nodeType']
    // >(
    //     nodeType: T,
    //     initialState: TypeOf<(N[number] & { nodeType: T })['stateDefinition']>
    // ) => Promise<UixNode<T, TypeOf<(N[number] & { nodeType: T })['stateDefinition']>>>,
    // getNode: <
    //     T extends N[number]['nodeType']
    // >(
    //     nodeType: T,
    //     nodeIndex: T extends keyof UIdx
    //     ? UIdx[T] extends string[]
    //     ? UIdx[T][number] | 'nodeId'
    //     : 'nodeId'
    //     : 'nodeId',
    //     indexKey: string
    // ) => UixNode<T, TypeOf<(N[number] & { nodeType: T })['stateDefinition']>>, 
    // updateNode: <
    //     T extends N[number]['nodeType']
    // >(
    //     node: NodeKey<T>,
    //     state: Partial<TypeOf<(N[number] & { nodeType: T })['stateDefinition']>>
    // ) => UixNode<T, TypeOf<(N[number] & { nodeType: T })['stateDefinition']>>

}


