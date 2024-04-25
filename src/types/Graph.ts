import { TypeOf, ZodObject, ZodRawShape, z } from "zod"
import { defineNode } from "../base/defineNode"
import { NodeKey } from "./NodeKey"
import { UixNode } from "./UixNode"



type ThisGraph = GraphLayer<[
    ReturnType<typeof defineNode< 'User', ReturnType<typeof z.object<{
        email: ReturnType<typeof z.string>
        name: ReturnType<typeof z.string>
        password: ReturnType<typeof z.string>
    }>>>>,
    ReturnType<typeof defineNode< 'Post', ReturnType<typeof z.object<{
        title: ReturnType<typeof z.string>
        content: ReturnType<typeof z.string>
    }>>>>,
    ReturnType<typeof defineNode< 'Company', ReturnType<typeof z.object<{
        name: ReturnType<typeof z.string>
    }>>>>
], {
    'User': {
        'HAS_POST': {
            toNodeType: ['Post'],
            stateDefinition: ReturnType<typeof z.object<{
                createdAt: ReturnType<typeof z.string>,
                updatedAt: ReturnType<typeof z.string>
            }>>
        },
        'WORKED_AT': {
            toNodeType: ['Company']
        }
    },
    'Post': {
        'HAS_USER': {
            toNodeType: ['User', 'Company'],
            stateDefinition: ReturnType<typeof z.object<{
                createdAt: ReturnType<typeof z.string>,
                updatedAt: ReturnType<typeof z.string>
            }>>
        }
    },
}, {
    'User': ['email'],
    'Post': ['title']
}>

type CreateRelationship = ThisGraph['createRelationship']
const createRelationship = null as unknown as CreateRelationship
createRelationship({ nodeType: 'Post', nodeId: '123' }, 'HAS_USER', null as unknown as NodeKey<'Company'>, {
    createdAt: '2021-01-01',
    updatedAt: '2021-01-01'
})
createRelationship({ nodeType: 'User', nodeId: '123' }, 'HAS_POST', null as unknown as NodeKey<'Company'>, {
    createdAt: '2021-01-01',
    updatedAt: '2021-01-01'
})
type GetNode = ThisGraph['getNode']
const getNode = null as unknown as GetNode
getNode('User', 'email', '')

export type GraphLayer<
    N extends readonly ReturnType<typeof defineNode< any, any>>[],
    // R extends readonly ReturnType<typeof >
    R extends { [K in N[number]['nodeType']]?: {
        readonly [R: Uppercase<string>]: {
            toNodeType: readonly N[number]['nodeType'][]
            stateDefinition?: ZodObject<any>
        }
    }},
    UIdx extends {
        [T in N[number]['nodeType']]?: readonly (keyof TypeOf<(N[number] & { nodeType: T })['stateDefinition']>)[]
    },
> = {
    nodeDefinitions: N,
    relationshipDefinitions: R,
    uniqueIndexes: UIdx,
    //      ___              _         ___     _      _   _             _    _      
    //     / __|_ _ ___ __ _| |_ ___  | _ \___| |__ _| |_(_)___ _ _  __| |_ (_)_ __ 
    //    | (__| '_/ -_) _` |  _/ -_) |   / -_) / _` |  _| / _ \ ' \(_-< ' \| | '_ \
    //     \___|_| \___\__,_|\__\___| |_|_\___|_\__,_|\__|_\___/_||_/__/_||_|_| .__/
    //                                                                        |_|   
    createRelationship: <
        NodeType extends N[number]['nodeType'],
        RelationshipType extends (keyof (R[NodeType]))
    >(
        fromNode: NodeKey<NodeType>,
        relationshipType: RelationshipType,
        toNode: NodeKey<{
            [RelationshipTypeKey in keyof R[NodeType]]: {
                [Key in keyof R[NodeType][RelationshipTypeKey]]: R[NodeType][RelationshipTypeKey][Key] extends any[] 
                    ? R[NodeType][RelationshipTypeKey][Key][number] extends Capitalize<string> ? R[NodeType][RelationshipTypeKey][Key][number] : never
                    : R[NodeType][RelationshipTypeKey][Key] extends Capitalize<string> ? R[NodeType][RelationshipTypeKey][Key] : never
            }[keyof R[NodeType][RelationshipTypeKey]]
        }[keyof R[NodeType]]>,
        ...[state]: {[RelationshipTypeKey in keyof R[NodeType]]: {
                [Key in keyof R[NodeType][RelationshipTypeKey]]: R[NodeType][RelationshipTypeKey][Key] extends ZodObject<ZodRawShape> 
                    ? R[NodeType][RelationshipTypeKey][Key] extends ZodObject<ZodRawShape> ? [TypeOf<R[NodeType][RelationshipTypeKey][Key]>] : []
                : never
            }[keyof R[NodeType][RelationshipTypeKey]]
        }[keyof R[NodeType]]
    ) => void
    //      ___              _         _  _         _     
    //     / __|_ _ ___ __ _| |_ ___  | \| |___  __| |___ 
    //    | (__| '_/ -_) _` |  _/ -_) | .` / _ \/ _` / -_)
    //     \___|_| \___\__,_|\__\___| |_|\_\___/\__,_\___|
    createNode: <
        T extends N[number]['nodeType']
    >(
        nodeType: T,
        initialState: TypeOf<(N[number] & { nodeType: T })['stateDefinition']>
    ) => Promise<UixNode<T, TypeOf<(N[number] & { nodeType: T })['stateDefinition']>>>,

    //      ___     _     _  _         _     
    //     / __|___| |_  | \| |___  __| |___ 
    //    | (_ / -_)  _| | .` / _ \/ _` / -_)
    //     \___\___|\__| |_|\_\___/\__,_\___|
    getNode: <
        T extends N[number]['nodeType']
    >(
        nodeType: T,
        nodeIndex: UIdx[T] extends string[]
            ? UIdx[T][number] | 'nodeId'
            : 'nodeId',
        indexKey: string
    ) => Promise<UixNode<T, TypeOf<(N[number] & { nodeType: T })['stateDefinition']>>>, 

    //  _   _          _      _         _  _         _     
    // | | | |_ __  __| |__ _| |_ ___  | \| |___  __| |___ 
    // | |_| | '_ \/ _` / _` |  _/ -_) | .` / _ \/ _` / -_)
    //  \___/| .__/\__,_\__,_|\__\___| |_|\_\___/\__,_\___|
    //       |_|                                           
    updateNode: <
        T extends N[number]['nodeType']
    >(
        nodeKey: NodeKey<T>,
        state: Partial<TypeOf<(N[number] & { nodeType: T })['stateDefinition']>>
    ) => Promise<UixNode<T, TypeOf<(N[number] & { nodeType: T })['stateDefinition']>>>



    //      ___     _     ___     _      _          _   _____    
    //     / __|___| |_  | _ \___| |__ _| |_ ___ __| | |_   _|__ 
    //    | (_ / -_)  _| |   / -_) / _` |  _/ -_) _` |   | |/ _ \
    //     \___\___|\__| |_|_\___|_\__,_|\__\___\__,_|   |_|\___/
    getRelatedTo: <
        FromNodeType extends N[number]['nodeType'],
        RelationshipType extends (keyof (R[FromNodeType])),
        ToNodeType extends {
            [RelationshipTypeKey in keyof R[FromNodeType]]: {
                [Key in keyof R[FromNodeType][RelationshipTypeKey]]: R[FromNodeType][RelationshipTypeKey][Key] extends any[] 
                    ? R[FromNodeType][RelationshipTypeKey][Key][number] extends Capitalize<string> ? R[FromNodeType][RelationshipTypeKey][Key][number] : never
                    : R[FromNodeType][RelationshipTypeKey][Key] extends Capitalize<string> ? R[FromNodeType][RelationshipTypeKey][Key] : never
            }[keyof R[FromNodeType][RelationshipTypeKey]]
        }[keyof R[FromNodeType]]
    >(
        fromNode: NodeKey<FromNodeType>,
        relationshipType: RelationshipType,
        toNodeType: ToNodeType
    ) => Promise<UixNode<ToNodeType, TypeOf<(N[number] & { nodeType: ToNodeType })['stateDefinition']>>[]>
}


