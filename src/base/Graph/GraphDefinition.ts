import { Ok, Result } from "@/src/types/Result";
import { NodeDefinition } from "../Node/NodeDefinition";
import { RelationshipDefinition } from "../Relationship/RelationshipDefinition";
import { v4 as uuidv4 } from 'uuid'
import { TypeOf } from "zod";
import { UixNode } from "@/src/types/UixNode";
import { UixLayerError } from "../LayerError/UixLayerError";



//  ___       __ _      _ _   _          
// |   \ ___ / _(_)_ _ (_) |_(_)___ _ _  
// | |) / -_)  _| | ' \| |  _| / _ \ ' \ 
// |___/\___|_| |_|_||_|_|\__|_\___/_||_| 
export class GraphDefinition<
    NodeDefinitions extends readonly NodeDefinition<any, any, any, any>[] = readonly NodeDefinition[],
    RelationshipDefinitions extends readonly RelationshipDefinition<any, any, any, any>[] = readonly RelationshipDefinition<any, any, any, any>[],
    CreateNode extends (
        nodeType: NodeDefinitions[number]['nodeType'],
        initialState: TypeOf<(NodeDefinitions[number])['stateSchema']>
    ) => Promise<Result<
        UixNode<typeof nodeType, typeof initialState>,
        ReturnType<ReturnType<typeof UixLayerError<'Base'>>>
    >> = (
        nodeType: NodeDefinitions[number]['nodeType'],
        initialState: TypeOf<(NodeDefinitions[number])['stateSchema']>
    ) => Promise<Result<
        UixNode<typeof nodeType, typeof initialState>,
        ReturnType<ReturnType<typeof UixLayerError<'Base'>>>
    >>
> {
    //  ___ _        _   _      ___             _   _             
    // / __| |_ __ _| |_(_)__  | __|  _ _ _  __| |_(_)___ _ _  ___
    // \__ \  _/ _` |  _| / _| | _| || | ' \/ _|  _| / _ \ ' \(_-<
    // |___/\__\__,_|\__|_\__| |_| \_,_|_||_\__|\__|_\___/_||_/__/
    static define = <
        NodeDefinitions extends readonly NodeDefinition<any, any, any, any>[],
        RelationshipDefinitions extends readonly RelationshipDefinition<any, any, any, any>[],
    >(
        nodeDefinitions: NodeDefinitions,
        relationshipDefinitions: RelationshipDefinitions,
    ) => new GraphDefinition(
        nodeDefinitions,
        relationshipDefinitions,
        async <
            NodeType extends NodeDefinitions[number]['nodeType'],
            InitialState extends TypeOf<(NodeDefinitions[number] & { nodeType: NodeType })['stateSchema']>
        >(
            nodeType: NodeType,
            initialState: InitialState
        ): Promise<Result<
            UixNode<NodeType, InitialState>,
            ReturnType<ReturnType<typeof UixLayerError<'Base'>>>
        >> => Ok({
            nodeType,
            nodeId: uuidv4(),
            createdAt: new Date().toISOString(),
            ...initialState
        })
    );
    //  ___                       _   _        
    // | _ \_ _ ___ _ __  ___ _ _| |_(_)___ ___
    // |  _/ '_/ _ \ '_ \/ -_) '_|  _| / -_|_-<
    // |_| |_| \___/ .__/\___|_|  \__|_\___/__/
    //             |_|           

    //      ___             _               _           
    //     / __|___ _ _  __| |_ _ _ _  _ __| |_ ___ _ _ 
    //    | (__/ _ \ ' \(_-<  _| '_| || / _|  _/ _ \ '_|
    //     \___\___/_||_/__/\__|_|  \_,_\__|\__\___/_|  
    private constructor(
        public nodeDefinitions: NodeDefinitions,
        public relationshipDefinitions: RelationshipDefinitions,
        public createNode: CreateNode
    ) { }
    //                   _  _         _       ___             _   _                           
    //     ___ ___ ___  | \| |___  __| |___  | __|  _ _ _  __| |_(_)___ _ _  ___  ___ ___ ___ 
    //    |___|___|___| | .` / _ \/ _` / -_) | _| || | ' \/ _|  _| / _ \ ' \(_-< |___|___|___|
    //                  |_|\_\___/\__,_\___| |_| \_,_|_||_\__|\__|_\___/_||_/__/              
    //      ___              _         _  _         _     
    //     / __|_ _ ___ __ _| |_ ___  | \| |___  __| |___ 
    //    | (__| '_/ -_) _` |  _/ -_) | .` / _ \/ _` / -_)
    //     \___|_| \___\__,_|\__\___| |_|\_\___/\__,_\___|
    // createNode = async <
    //     NodeType extends NodeDefinitions[number]['nodeType'],
    //     InitialState extends TypeOf<(NodeDefinitions[number] & { nodeType: NodeType })['stateSchema']>
    // >(
    //     nodeType: NodeType,
    //     initialState: InitialState
    // ): Promise<Result<
    //     UixNode<NodeType, InitialState>,
    //     ReturnType<ReturnType<typeof UixLayerError<'Base'>>>
    // >> => Ok({
    //     nodeType,
    //     nodeId: uuidv4(),
    //     createdAt: new Date().toISOString(),
    //     ...initialState
    // })
}