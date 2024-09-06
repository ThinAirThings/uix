import { TypeOf, ZodObject } from "zod"
import { AnyNodeDefinition, AnyNodeDefinitionMap, GenericNodeDefinition } from "./NodeDefinition"
import { RelationshipTypeUnion } from "../types/RelationshipUnion"


//  _   _ _   _ _ _ _          _____                  
// | | | | |_(_) (_) |_ _  _  |_   _|  _ _ __  ___ ___
// | |_| |  _| | | |  _| || |   | || || | '_ \/ -_|_-<
//  \___/ \__|_|_|_|\__|\_, |   |_| \_, | .__/\___/__/
//                      |__/        |__/|_|    
export type AnyRelationshipDefinition = RelationshipDefinition<any, any, any, any, any>
export type AnyRelationshipDefinitionSet = readonly AnyRelationshipDefinition[]

export type GenericRelationshipDefinitionSet = readonly GenericRelationshipDefinition[]
export type GenericRelationshipDefinition = RelationshipDefinition<
    GenericNodeDefinition,
    Uppercase<string>,
    StrengthTypeSet,
    GenericNodeDefinition,
    ZodObject<any> | undefined
>

export type RelationshipDefinitionMap<RelationshipDefinitionSet extends AnyRelationshipDefinitionSet> = Readonly<{
    [Type in RelationshipDefinitionSet[number]['type']]: (RelationshipDefinitionSet[number] & { type: Type });
}>

export type StrengthTypeSet = 'strong' | 'weak'
export type RelationshipMerge<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    PreviousNodeType extends keyof NodeDefinitionMap,
    RelationshipType extends RelationshipTypeUnion<NodeDefinitionMap, PreviousNodeType>,
> = {
    relationshipType: RelationshipType
} & RelationshipState<NodeDefinitionMap[PreviousNodeType]['relationshipDefinitionMap'][RelationshipType]>
export type RelationshipState<T extends AnyRelationshipDefinition> = TypeOf<T['stateSchema']>
export type RelationshipShape<T extends AnyRelationshipDefinition> = RelationshipState<T> & {
    relatedNodeId: string
    strength: T['strength']
}
export type GenericRelationshipShape = {
    relationshipType: string
    strength: StrengthTypeSet
}
//  ___       __ _      _ _   _          
// |   \ ___ / _(_)_ _ (_) |_(_)___ _ _  
// | |) / -_)  _| | ' \| |  _| / _ \ ' \ 
// |___/\___|_| |_|_||_|_|\__|_\___/_||_| 
export class RelationshipDefinition<
    FromNodeDefinition extends AnyNodeDefinition = GenericNodeDefinition,
    RelationshipType extends Uppercase<string> = Uppercase<string>,
    StrengthType extends StrengthTypeSet = StrengthTypeSet,
    ToNodeDefinition extends AnyNodeDefinition = GenericNodeDefinition,
    RelationshipStateSchema extends ZodObject<any> | undefined = undefined,
> {
    //      ___             _               _           
    //     / __|___ _ _  __| |_ _ _ _  _ __| |_ ___ _ _ 
    //    | (__/ _ \ ' \(_-<  _| '_| || / _|  _/ _ \ '_|
    //     \___\___/_||_/__/\__|_|  \_,_\__|\__\___/_|  
    constructor(
        public fromNodeDefinition: FromNodeDefinition,
        public type: RelationshipType,
        public strength: StrengthType,
        public toNodeDefinition: ToNodeDefinition,
        public stateSchema: RelationshipStateSchema = undefined as RelationshipStateSchema
    ) { }

    //  ___      _ _    _            
    // | _ )_  _(_) |__| |___ _ _ ___
    // | _ \ || | | / _` / -_) '_(_-<
    // |___/\_,_|_|_\__,_\___|_| /__/
}
