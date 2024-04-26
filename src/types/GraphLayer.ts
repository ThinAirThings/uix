import { TypeOf, ZodObject, ZodRawShape, z } from "zod"
import { defineNode } from "../base/defineNode"
import { NodeKey } from "./NodeKey"
import { UixNode } from "./UixNode"
import { UixRelationship } from "./UixRelationship"
import { Result } from 'ts-results';
import { UixError } from "../base/UixError"


export type GraphLayer<
    N extends readonly ReturnType<typeof defineNode< any, any>>[],
    R extends readonly {
        relationshipType: Uppercase<string>
        stateDefinition?: ZodObject<any>
    }[],
    E extends Readonly<{ [NT in (N[number]['nodeType'])]?: {
        [RT in R[number]['relationshipType']]?: readonly N[number]['nodeType'][]
    } }>,
    UIdx extends {
        [T in N[number]['nodeType']]?: readonly (keyof TypeOf<(N[number] & { nodeType: T })['stateDefinition']>)[]
    },
    LayerError extends UixError<any, any> = UixError<any, any>
> = {

    //                   _____                 __  __     _           _      _                      
    //     ___ ___ ___  |_   _|  _ _ __  ___  |  \/  |___| |_ __ _ __| |__ _| |_ __ _   ___ ___ ___ 
    //    |___|___|___|   | || || | '_ \/ -_) | |\/| / -_)  _/ _` / _` / _` |  _/ _` | |___|___|___|
    //                    |_| \_, | .__/\___| |_|  |_\___|\__\__,_\__,_\__,_|\__\__,_|              
    //                        |__/|_|                                                               
    nodeDefinitions: N,
    relationshipDefinitions: R,
    edgeDefinitions: E,
    uniqueIndexes: UIdx,
    //                   _  _         _       ___             _   _                           
    //     ___ ___ ___  | \| |___  __| |___  | __|  _ _ _  __| |_(_)___ _ _  ___  ___ ___ ___ 
    //    |___|___|___| | .` / _ \/ _` / -_) | _| || | ' \/ _|  _| / _ \ ' \(_-< |___|___|___|
    //                  |_|\_\___/\__,_\___| |_| \_,_|_||_\__|\__|_\___/_||_/__/              

    //      ___              _         _  _         _     
    //     / __|_ _ ___ __ _| |_ ___  | \| |___  __| |___ 
    //    | (__| '_/ -_) _` |  _/ -_) | .` / _ \/ _` / -_)
    //     \___|_| \___\__,_|\__\___| |_|\_\___/\__,_\___|
    createNode: <
        T extends N[number]['nodeType']
    >(
        nodeType: T,
        initialState: TypeOf<(N[number] & { nodeType: T })['stateDefinition']>
    ) => Promise<Result<
        NodeKey<T>,
        LayerError
    >>,

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
    ) => Promise<Result<
        UixNode<T, TypeOf<(N[number] & { nodeType: T })['stateDefinition']>>,
        LayerError
    >>,

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
    ) => Promise<Result<
        UixNode<T, TypeOf<(N[number] & { nodeType: T })['stateDefinition']>>,
        LayerError
    >>

    //  ___      _     _         _  _         _     
    // |   \ ___| |___| |_ ___  | \| |___  __| |___ 
    // | |) / -_) / -_)  _/ -_) | .` / _ \/ _` / -_)
    // |___/\___|_\___|\__\___| |_|\_\___/\__,_\___|
    deleteNode: <
        T extends N[number]['nodeType']
    >(
        nodeKey: NodeKey<T>
    ) => Promise<Result<
        UixNode<T, TypeOf<(N[number] & { nodeType: T })['stateDefinition']>>,
        LayerError
    >>

    //                   ___     _      _   _             _    _        ___             _   _                           
    //     ___ ___ ___  | _ \___| |__ _| |_(_)___ _ _  __| |_ (_)_ __  | __|  _ _ _  __| |_(_)___ _ _  ___  ___ ___ ___ 
    //    |___|___|___| |   / -_) / _` |  _| / _ \ ' \(_-< ' \| | '_ \ | _| || | ' \/ _|  _| / _ \ ' \(_-< |___|___|___|
    //                  |_|_\___|_\__,_|\__|_\___/_||_/__/_||_|_| .__/ |_| \_,_|_||_\__|\__|_\___/_||_/__/              
    //                                                          |_|                                                     

    //      ___              _         ___     _      _   _             _    _      
    //     / __|_ _ ___ __ _| |_ ___  | _ \___| |__ _| |_(_)___ _ _  __| |_ (_)_ __ 
    //    | (__| '_/ -_) _` |  _/ -_) |   / -_) / _` |  _| / _ \ ' \(_-< ' \| | '_ \
    //     \___|_| \___\__,_|\__\___| |_|_\___|_\__,_|\__|_\___/_||_/__/_||_|_| .__/
    //                                                                        |_|   
    createRelationship: <
        FromNodeType extends (keyof E & Capitalize<string>),
        RelationshipType extends ((keyof E[FromNodeType]) & Uppercase<string>),
        ToNodeType extends E[FromNodeType][RelationshipType] extends readonly any[] ? E[FromNodeType][RelationshipType][number] : never
    >(
        fromNode: NodeKey<FromNodeType>,
        relationshipType: RelationshipType,
        toNode: Result<NodeKey<ToNodeType>, LayerError> | NodeKey<ToNodeType>,
        ...[state]: NonNullable<(R[number] & { relationshipType: RelationshipType })['stateDefinition']> extends ZodObject<ZodRawShape>
            ? [TypeOf<NonNullable<(R[number] & { relationshipType: RelationshipType })['stateDefinition']>>]
            : []
    ) => Promise<Result<{
        fromNode: UixNode<FromNodeType, TypeOf<(N[number] & { nodeType: FromNodeType })['stateDefinition']>>,
        relationship: UixRelationship<RelationshipType, TypeOf<NonNullable<(R[number] & { relationshipType: RelationshipType })['stateDefinition']>>>,
        toNode: UixNode<ToNodeType, TypeOf<(N[number] & { nodeType: ToNodeType })['stateDefinition']>>
    }, LayerError>>
    //      ___     _     ___     _      _          _   _____    
    //     / __|___| |_  | _ \___| |__ _| |_ ___ __| | |_   _|__ 
    //    | (_ / -_)  _| |   / -_) / _` |  _/ -_) _` |   | |/ _ \
    //     \___\___|\__| |_|_\___|_\__,_|\__\___\__,_|   |_|\___/
    getRelatedTo: <
        FromNodeType extends keyof E,
        RelationshipType extends ((keyof E[FromNodeType]) & R[number]['relationshipType']),
        ToNodeType extends E[FromNodeType][RelationshipType] extends readonly any[] ? E[FromNodeType][RelationshipType][number] : never
    >(
        fromNode: NodeKey<FromNodeType & Capitalize<string>>,
        relationshipType: RelationshipType,
        toNodeType: ToNodeType
    ) => Promise<Result<
        UixNode<ToNodeType, TypeOf<(N[number] & { nodeType: ToNodeType })['stateDefinition']>>[],
        LayerError
    >>

    //                   __  __     _          ___             _   _               _ _ _                      
    //     ___ ___ ___  |  \/  |___| |_ __ _  | __|  _ _ _  __| |_(_)___ _ _  __ _| (_) |_ _  _   ___ ___ ___ 
    //    |___|___|___| | |\/| / -_)  _/ _` | | _| || | ' \/ _|  _| / _ \ ' \/ _` | | |  _| || | |___|___|___|
    //                  |_|  |_\___|\__\__,_| |_| \_,_|_||_\__|\__|_\___/_||_\__,_|_|_|\__|\_, |              
    //                                                                                     |__/               

    //      ___     _     ___       __ _      _ _   _          
    //     / __|___| |_  |   \ ___ / _(_)_ _ (_) |_(_)___ _ _  
    //    | (_ / -_)  _| | |) / -_)  _| | ' \| |  _| / _ \ ' \ 
    //     \___\___|\__| |___/\___|_| |_|_||_|_|\__|_\___/_||_|
    getDefinition: <
        T extends N[number]['nodeType']
    >(
        nodeType: T
    ) => ReturnType<typeof defineNode<any, any>>,
}

