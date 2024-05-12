import { ZodObject } from "zod"
import { AnyNodeTypeSet, GenericNodeTypeSet } from "../Graph/GraphType";


//  _   _ _   _ _ _ _          _____                  
// | | | | |_(_) (_) |_ _  _  |_   _|  _ _ __  ___ ___
// | |_| |  _| | | |  _| || |   | || || | '_ \/ -_|_-<
//  \___/ \__|_|_|_|\__|\_, |   |_| \_, | .__/\___/__/
//                      |__/        |__/|_|    
export type AnyRelationshipType = RelationshipType<any, any, any, any>
export type GenericRelationshipType = RelationshipType<
    GenericNodeTypeSet[number]['type'],
    Uppercase<string>,
    GenericNodeTypeSet[number]['type'],
    ZodObject<any> | undefined
>
//  ___       __ _      _ _   _          
// |   \ ___ / _(_)_ _ (_) |_(_)___ _ _  
// | |) / -_)  _| | ' \| |  _| / _ \ ' \ 
// |___/\___|_| |_|_||_|_|\__|_\___/_||_| 
export class RelationshipType<
    FromNodeTypeSet extends AnyNodeTypeSet[number]['type'] = GenericNodeTypeSet[number]['type'],
    RelationshipType extends Uppercase<string> = Uppercase<string>,
    ToNodeTypeSet extends AnyNodeTypeSet[number]['type'] = GenericNodeTypeSet[number]['type'],
    StateSchema extends ZodObject<any> | undefined = undefined,
> {
    //  ___ _        _   _      ___             _   _             
    // / __| |_ __ _| |_(_)__  | __|  _ _ _  __| |_(_)___ _ _  ___
    // \__ \  _/ _` |  _| / _| | _| || | ' \/ _|  _| / _ \ ' \(_-<
    // |___/\__\__,_|\__|_\__| |_| \_,_|_||_\__|\__|_\___/_||_/__/
    static constrain = <
        NodeTypeSet extends AnyNodeTypeSet,
    >(
        // Note: You could do interesting things here like create a set of similarity scores between different types
        // of nodes and use the node state schemas to create embedding scores
        _nodeDefinitions: NodeTypeSet
    ) => class ConstrainedRelationshipType<
        FromNodeTypeSet extends NodeTypeSet[number]['type'][],
        Type extends Uppercase<string>,
        ToNodeTypeSet extends NodeTypeSet[number]['type'][],
        StateSchema extends ZodObject<any> | undefined = undefined
    > extends RelationshipType<FromNodeTypeSet, Type, ToNodeTypeSet, StateSchema> {
            static define = <
                FromNodeTypeSet extends NodeTypeSet[number]['type'][],
                RelationshipType extends Uppercase<string>,
                ToNodeTypeSet extends NodeTypeSet[number]['type'][],
            >(
                fromNodeTypeSet: FromNodeTypeSet,
                relationshipType: RelationshipType,
                toNodeTypeSet: ToNodeTypeSet
            ) => new ConstrainedRelationshipType(
                fromNodeTypeSet,
                relationshipType,
                toNodeTypeSet
            )
        }
    //      ___             _               _           
    //     / __|___ _ _  __| |_ _ _ _  _ __| |_ ___ _ _ 
    //    | (__/ _ \ ' \(_-<  _| '_| || / _|  _/ _ \ '_|
    //     \___\___/_||_/__/\__|_|  \_,_\__|\__\___/_|  
    private constructor(
        public fromNodeTypeSet: FromNodeTypeSet,
        public relationshipType: RelationshipType,
        public toNodeTypeSet: ToNodeTypeSet,
        public stateSchema: StateSchema = undefined as StateSchema
    ) { }


    //  ___      _ _    _            
    // | _ )_  _(_) |__| |___ _ _ ___
    // | _ \ || | | / _` / -_) '_(_-<
    // |___/\_,_|_|_\__,_\___|_| /__/
    defineStateSchema<StateSchema extends ZodObject<any>>(
        stateSchema: StateSchema
    ) {
        return new RelationshipType(
            this.fromNodeTypeSet,
            this.relationshipType,
            this.toNodeTypeSet,
            stateSchema
        )
    }
}