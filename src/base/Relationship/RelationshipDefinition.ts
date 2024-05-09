import { ZodObject } from "zod"
import { NodeDefinition } from "../Node/NodeDefinition";


//  _   _ _   _ _ _ _          _____                  
// | | | | |_(_) (_) |_ _  _  |_   _|  _ _ __  ___ ___
// | |_| |  _| | | |  _| || |   | || || | '_ \/ -_|_-<
//  \___/ \__|_|_|_|\__|\_, |   |_| \_, | .__/\___/__/
//                      |__/        |__/|_|    
export type RelationshipDefinitionsAny = readonly RelationshipDefinition<any, any, any, any>[]

//  ___       __ _      _ _   _          
// |   \ ___ / _(_)_ _ (_) |_(_)___ _ _  
// | |) / -_)  _| | ' \| |  _| / _ \ ' \ 
// |___/\___|_| |_|_||_|_|\__|_\___/_||_| 
export class RelationshipDefinition<
    FromNodeType extends Capitalize<string> = Capitalize<string>,
    RelationshipType extends Uppercase<string> = Uppercase<string>,
    ToNodeType extends Capitalize<string> = Capitalize<string>,
    StateSchema extends ZodObject<any> | undefined = undefined,
> {
    //  ___ _        _   _      ___             _   _             
    // / __| |_ __ _| |_(_)__  | __|  _ _ _  __| |_(_)___ _ _  ___
    // \__ \  _/ _` |  _| / _| | _| || | ' \/ _|  _| / _ \ ' \(_-<
    // |___/\__\__,_|\__|_\__| |_| \_,_|_||_\__|\__|_\___/_||_/__/
    static constrain = <
        NodeDefinitions extends readonly NodeDefinition<any, any, any, any>[],
    >(
        // Note: You could do interesting things here like create a set of similarity scores between different types
        // of nodes and use the node state schemas to create embedding scores
        _nodeDefinitions: NodeDefinitions
    ) => class ConstrainedRelationshipDefinition<
        FromNodeType extends NodeDefinitions[number]['nodeType'],
        RelationshipType extends Uppercase<string>,
        ToNodeType extends NodeDefinitions[number]['nodeType'],
        StateSchema extends ZodObject<any> | undefined = undefined
    > extends RelationshipDefinition<FromNodeType, RelationshipType, ToNodeType, StateSchema> {
            static define = <
                FromNodeType extends NodeDefinitions[number]['nodeType'],
                RelationshipType extends Uppercase<string>,
                ToNodeType extends NodeDefinitions[number]['nodeType'],
            >(
                fromNodeType: FromNodeType[],
                relationshipType: RelationshipType,
                toNodeType: ToNodeType[]
            ) => new ConstrainedRelationshipDefinition(
                fromNodeType,
                relationshipType,
                toNodeType
            )
        }
    //      ___             _               _           
    //     / __|___ _ _  __| |_ _ _ _  _ __| |_ ___ _ _ 
    //    | (__/ _ \ ' \(_-<  _| '_| || / _|  _/ _ \ '_|
    //     \___\___/_||_/__/\__|_|  \_,_\__|\__\___/_|  
    private constructor(
        public fromNodeType: FromNodeType[],
        public relationshipType: RelationshipType,
        public toNodeType: ToNodeType[],
        public stateSchema: StateSchema = undefined as StateSchema
    ) { }


    //  ___      _ _    _            
    // | _ )_  _(_) |__| |___ _ _ ___
    // | _ \ || | | / _` / -_) '_(_-<
    // |___/\_,_|_|_\__,_\___|_| /__/
    defineStateSchema<StateSchema extends ZodObject<any>>(
        stateSchema: StateSchema
    ) {
        return new RelationshipDefinition(
            this.fromNodeType,
            this.relationshipType,
            this.toNodeType,
            stateSchema
        )
    }
}