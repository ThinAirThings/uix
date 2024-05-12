import { AnyNodeType, GenericNodeType } from "../Node/NodeType";
import { AnyRelationshipType, GenericRelationshipType } from "../Relationship/RelationshipType";

//  _   _ _   _ _ _ _          _____                  
// | | | | |_(_) (_) |_ _  _  |_   _|  _ _ __  ___ ___
// | |_| |  _| | | |  _| || |   | || || | '_ \/ -_|_-<
//  \___/ \__|_|_|_|\__|\_, |   |_| \_, | .__/\___/__/
//                      |__/        |__/|_|      
export type AnyGraphType = GraphType<any, any, any>
export type GenericNodeTypeSet = readonly GenericNodeType[]
export type AnyNodeTypeSet = readonly AnyNodeType[]
export type GenericRelationshipTypeSet = readonly GenericRelationshipType[]
export type AnyRelationshipTypeSet = readonly AnyRelationshipType[]
//  ___       __ _      _ _   _          
// |   \ ___ / _(_)_ _ (_) |_(_)___ _ _  
// | |) / -_)  _| | ' \| |  _| / _ \ ' \ 
// |___/\___|_| |_|_||_|_|\__|_\___/_||_| 
export class GraphType<
    Type extends Capitalize<string> = Capitalize<string>,
    NodeTypeSet extends AnyNodeTypeSet = GenericNodeTypeSet,
    RelationshipTypeSet extends AnyRelationshipTypeSet = GenericRelationshipTypeSet,
> {
    //  ___ _        _   _      ___             _   _             
    // / __| |_ __ _| |_(_)__  | __|  _ _ _  __| |_(_)___ _ _  ___
    // \__ \  _/ _` |  _| / _| | _| || | ' \/ _|  _| / _ \ ' \(_-<
    // |___/\__\__,_|\__|_\__| |_| \_,_|_||_\__|\__|_\___/_||_/__/
    static define = <
        Type extends Capitalize<string>,
        NodeTypeSet extends AnyNodeTypeSet,
        RelationshipTypeSet extends AnyRelationshipTypeSet,
    >(
        type: Type,
        nodeTypeSet: NodeTypeSet,
        relationshipTypeSet: RelationshipTypeSet,
    ) => new GraphType(
        type,
        nodeTypeSet,
        relationshipTypeSet,
    )
    //      ___             _               _           
    //     / __|___ _ _  __| |_ _ _ _  _ __| |_ ___ _ _ 
    //    | (__/ _ \ ' \(_-<  _| '_| || / _|  _/ _ \ '_|
    //     \___\___/_||_/__/\__|_|  \_,_\__|\__\___/_|  
    constructor(
        public type: Type,
        public nodeTypeSet: NodeTypeSet,
        public relationshipTypeSet: RelationshipTypeSet,
    ) { }
}