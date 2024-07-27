import { TypeOf, ZodObject } from "zod"
import { AnyNodeDefinition, GenericNodeDefinition } from "./NodeDefinition"


//  _   _ _   _ _ _ _          _____                  
// | | | | |_(_) (_) |_ _  _  |_   _|  _ _ __  ___ ___
// | |_| |  _| | | |  _| || |   | || || | '_ \/ -_|_-<
//  \___/ \__|_|_|_|\__|\_, |   |_| \_, | .__/\___/__/
//                      |__/        |__/|_|    
export type AnyRelationshipDefinition = RelationshipDefinition<any, any, any, any, any, any>
export type GenericRelationshipDefinition = RelationshipDefinition<
    AnyNodeDefinition,
    Uppercase<string>,
    CardinalityTypeSet,
    StrengthTypeSet,
    AnyNodeDefinition,
    ZodObject<any> | undefined
>
export type GenericRelationshipDefinitionSet = readonly GenericRelationshipDefinition[]
export type AnyRelationshipDefinitionSet = readonly AnyRelationshipDefinition[]
export type CardinalityTypeSet = 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'
export type StrengthTypeSet = 'strong' | 'weak'
export type RelationshipState<T extends AnyRelationshipDefinition> = TypeOf<T['stateSchema']>
export type RelationshipShape<T extends AnyRelationshipDefinition> = RelationshipState<T> & {
    relatedNodeId: string
    cardinality: T['cardinality']
    strength: T['strength']
}
export type GenericRelationshipShape = {
    relationshipType: string
}
//  ___       __ _      _ _   _          
// |   \ ___ / _(_)_ _ (_) |_(_)___ _ _  
// | |) / -_)  _| | ' \| |  _| / _ \ ' \ 
// |___/\___|_| |_|_||_|_|\__|_\___/_||_| 
export class RelationshipDefinition<
    FromNodeDefinition extends AnyNodeDefinition = GenericNodeDefinition,
    RelationshipType extends Uppercase<string> = Uppercase<string>,
    CardinalityType extends CardinalityTypeSet = CardinalityTypeSet,
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
        public cardinality: CardinalityType,
        public strength: StrengthType,
        public toNodeDefinition: ToNodeDefinition,
        public stateSchema: RelationshipStateSchema = undefined as RelationshipStateSchema
    ) { }

    //  ___      _ _    _            
    // | _ )_  _(_) |__| |___ _ _ ___
    // | _ \ || | | / _` / -_) '_(_-<
    // |___/\_,_|_|_\__,_\___|_| /__/
}
