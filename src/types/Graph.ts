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
], [
    {
        relationshipType: 'HAS_POST', 
        stateDefinition: ReturnType<typeof z.object<{
            createdAtTime: ReturnType<typeof z.string>
            updatedAt: ReturnType<typeof z.string>
        }>>,
    },
    {
        relationshipType: 'WORKED_AT',
    },
    {
        relationshipType: 'HAS_USER',
        stateDefinition: ReturnType<typeof z.object<{
            createdAt: ReturnType<typeof z.string>
            updatedAt: ReturnType<typeof z.string>
        }>>
    }
], {
    'User': {
        'HAS_POST': ['Post'],
        'WORKED_AT': ['Company', 'Post']
    },
    'Post': {
        'HAS_USER': ['User']
    }
}, {
    'User': ['email'],
    'Post': ['title']
}>

type CreateRelationship = ThisGraph['createRelationship']
const createRelationship = null as unknown as CreateRelationship
createRelationship({ nodeType: 'User', nodeId: '123' }, 'WORKED_AT', null as unknown as NodeKey<'Company'>)

createRelationship({ nodeType: 'User', nodeId: '123' }, 'HAS_POST', null as unknown as NodeKey<'Post'>, 
{
    createdAtTime: '2021-01-01',
    updatedAt: '2021-01-01'
}
)
createRelationship({ nodeType: 'Post', nodeId: '123' }, 'HAS_USER', null as unknown as NodeKey<'User'>, {
    createdAt: '2021-01-01',
    updatedAt: '2021-01-01'
})
type GetNode = ThisGraph['getNode']
const getNode = null as unknown as GetNode
getNode('User', 'email', '')

export type GraphLayer<
    N extends readonly ReturnType<typeof defineNode< any, any>>[],
    R extends readonly {
        relationshipType: Uppercase<string>
        stateDefinition?: ZodObject<any>
    }[],
    E extends Readonly<{ [NT in (N[number]['nodeType'])]?: {
        [RT in R[number]['relationshipType']]?: readonly N[number]['nodeType'][]
    }}>,
    UIdx extends {
        [T in N[number]['nodeType']]?: readonly (keyof TypeOf<(N[number] & { nodeType: T })['stateDefinition']>)[]
    },
> = {
    nodeDefinitions: N,
    relationshipDefinitions: R,
    edgeDefinitions: E,
    uniqueIndexes: UIdx,
    //      ___              _         ___     _      _   _             _    _      
    //     / __|_ _ ___ __ _| |_ ___  | _ \___| |__ _| |_(_)___ _ _  __| |_ (_)_ __ 
    //    | (__| '_/ -_) _` |  _/ -_) |   / -_) / _` |  _| / _ \ ' \(_-< ' \| | '_ \
    //     \___|_| \___\__,_|\__\___| |_|_\___|_\__,_|\__|_\___/_||_/__/_||_|_| .__/
    //                                                                        |_|   
    createRelationship: <
        NodeType extends keyof E,
        RelationshipType extends ((keyof E[NodeType])),
        ToNodeType extends E[NodeType][RelationshipType] extends readonly any[] ? E[NodeType][RelationshipType][number] : never
    >(
        fromNode: NodeKey<NodeType&Capitalize<string>>,
        relationshipType: RelationshipType,
        toNode: NodeKey<ToNodeType>,
       ...[state]: NonNullable<(R[number] & { relationshipType: RelationshipType })['stateDefinition']> extends ZodObject<ZodRawShape>
            ? [TypeOf<NonNullable<(R[number] & { relationshipType: RelationshipType })['stateDefinition']>>]
            : []
    ) => void
    //      ___     _     ___     _      _          _   _____    
    //     / __|___| |_  | _ \___| |__ _| |_ ___ __| | |_   _|__ 
    //    | (_ / -_)  _| |   / -_) / _` |  _/ -_) _` |   | |/ _ \
    //     \___\___|\__| |_|_\___|_\__,_|\__\___\__,_|   |_|\___/
    getRelatedTo: <
        FromNodeType extends keyof E,
        RelationshipType extends ((keyof E[FromNodeType]) & R[number]['relationshipType']),
        ToNodeType extends E[FromNodeType][RelationshipType] extends any[] ? E[FromNodeType][RelationshipType][number] : never
    >(
        fromNode: NodeKey<FromNodeType&Capitalize<string>>,
        relationshipType: RelationshipType,
        toNodeType: ToNodeType
    ) => Promise<UixNode<ToNodeType, TypeOf<(N[number] & { nodeType: ToNodeType })['stateDefinition']>>[]>

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



}


