import { Ok, Result } from "@/src/types/Result";
import { NodeDefinition, NodeDefinitionAny } from "../Node/NodeDefinition";
import { RelationshipDefinition, RelationshipDefinitionAny } from "../Relationship/RelationshipDefinition";
import { v4 as uuidv4 } from 'uuid'
import { TypeOf } from "zod";
import { UixNode } from "@/src/types/UixNode";
import { UixLayerError } from "../LayerError/UixLayerError";

//  _   _ _   _ _ _ _          _____                  
// | | | | |_(_) (_) |_ _  _  |_   _|  _ _ __  ___ ___
// | |_| |  _| | | |  _| || |   | || || | '_ \/ -_|_-<
//  \___/ \__|_|_|_|\__|\_, |   |_| \_, | .__/\___/__/
//                      |__/        |__/|_|      
export type CreateNodeFunction<
    NodeDefinitions extends readonly NodeDefinition<any, any, any, any>[],
    ErrorType
> =
    <
        NodeType extends NodeDefinitions[number]['nodeType'],
        InitialState extends TypeOf<(NodeDefinitions[number] & { nodeType: NodeType })['stateSchema']>
    >(
        nodeType: NodeType,
        initialState: InitialState
    ) => Promise<Result<
        UixNode<NodeType, InitialState>,
        ErrorType
    >>
export type GraphDefinitionAny = GraphDefinition<any, any, any>
export type NodeDefinitionsDefault = readonly NodeDefinition[]
export type NodeDefinitionsAny = readonly NodeDefinitionAny[]
export type RelationshipDefinitionsDefault = readonly RelationshipDefinition[]
export type RelationshipDefinitionsAny = readonly RelationshipDefinitionAny[]
//  ___       __ _      _ _   _          
// |   \ ___ / _(_)_ _ (_) |_(_)___ _ _  
// | |) / -_)  _| | ' \| |  _| / _ \ ' \ 
// |___/\___|_| |_|_||_|_|\__|_\___/_||_| 
export class GraphDefinition<
    GraphType extends Capitalize<string> = Capitalize<string>,
    NodeDefinitions extends NodeDefinitionsAny = NodeDefinitionsDefault,
    RelationshipDefinitions extends RelationshipDefinitionsAny = RelationshipDefinitionsDefault,
> {
    //  ___ _        _   _      ___             _   _             
    // / __| |_ __ _| |_(_)__  | __|  _ _ _  __| |_(_)___ _ _  ___
    // \__ \  _/ _` |  _| / _| | _| || | ' \/ _|  _| / _ \ ' \(_-<
    // |___/\__\__,_|\__|_\__| |_| \_,_|_||_\__|\__|_\___/_||_/__/
    static define = <
        GraphType extends Capitalize<string>,
        NodeDefinitions extends NodeDefinitionsAny,
        RelationshipDefinitions extends RelationshipDefinitionsAny,
    >(
        graphType: GraphType,
        nodeDefinitions: NodeDefinitions,
        relationshipDefinitions: RelationshipDefinitions,
    ) => new GraphDefinition(
        graphType,
        nodeDefinitions,
        relationshipDefinitions,
    )
    //      ___             _               _           
    //     / __|___ _ _  __| |_ _ _ _  _ __| |_ ___ _ _ 
    //    | (__/ _ \ ' \(_-<  _| '_| || / _|  _/ _ \ '_|
    //     \___\___/_||_/__/\__|_|  \_,_\__|\__\___/_|  
    constructor(
        public graphType: GraphType,
        public nodeDefinitions: NodeDefinitions,
        public relationshipDefinitions: RelationshipDefinitions,
    ) { }

    // You don't need to pass graph here, you can use 'this'
    // extend = (graph: GraphDefinition<NodeDefinitions, RelationshipDefinitions>) => { }
    // new GraphDefinition(
    //     nodeDefinitions,
    //     relationshipDefinitions,
    //     // async (nodeType, initialState) => {
    //     //     // if (nodeType === 'cheese') {
    //     //     //     return UixLayerError('Base')('CheeseError', 'Cheese is not allowed')
    //     //     // }
    //     //     return Ok({
    //     //         nodeType,
    //     //         nodeId: uuidv4(),
    //     //         createdAt: new Date().toISOString(),
    //     //         ...initialState
    //     //     })
    //     // }
    // );
    //  ___                       _   _        
    // | _ \_ _ ___ _ __  ___ _ _| |_(_)___ ___
    // |  _/ '_/ _ \ '_ \/ -_) '_|  _| / -_|_-<
    // |_| |_| \___/ .__/\___|_|  \__|_\___/__/
    //             |_|           


    //                   _  _         _       ___             _   _                           
    //     ___ ___ ___  | \| |___  __| |___  | __|  _ _ _  __| |_(_)___ _ _  ___  ___ ___ ___ 
    //    |___|___|___| | .` / _ \/ _` / -_) | _| || | ' \/ _|  _| / _ \ ' \(_-< |___|___|___|
    //                  |_|\_\___/\__,_\___| |_| \_,_|_||_\__|\__|_\___/_||_/__/              
}