import { GenericNodeDefinitionSet, NodeDefinitionMap } from './NodeDefinition';
import { AnyNodeDefinitionSet } from './NodeDefinition';

//  _   _ _   _ _ _ _          _____                  
// | | | | |_(_) (_) |_ _  _  |_   _|  _ _ __  ___ ___
// | |_| |  _| | | |  _| || |   | || || | '_ \/ -_|_-<
//  \___/ \__|_|_|_|\__|\_, |   |_| \_, | .__/\___/__/
//                      |__/        |__/|_|      
export type AnyGraphDefinition = GraphDefinition<any, any>
export type GenericGraphDefinition = GraphDefinition<
    Capitalize<string>,
    GenericNodeDefinitionSet
>

//  ___       __ _      _ _   _          
// |   \ ___ / _(_)_ _ (_) |_(_)___ _ _  
// | |) / -_)  _| | ' \| |  _| / _ \ ' \ 
// |___/\___|_| |_|_||_|_|\__|_\___/_||_| 
export class GraphDefinition<
    Type extends Capitalize<string> = Capitalize<string>,
    NodeDefinitionSet extends AnyNodeDefinitionSet = GenericNodeDefinitionSet,
> {
    //      ___             _               _           
    //     / __|___ _ _  __| |_ _ _ _  _ __| |_ ___ _ _ 
    //    | (__/ _ \ ' \(_-<  _| '_| || / _|  _/ _ \ '_|
    //     \___\___/_||_/__/\__|_|  \_,_\__|\__\___/_|  
    constructor(
        public type: Type,
        public nodeDefinitionSet: NodeDefinitionSet,
        public nodeTypeMap: NodeDefinitionMap<NodeDefinitionSet> = Object.fromEntries(
            nodeDefinitionSet.map(nodeType => [nodeType.type, nodeType])
        ),
    ) { }

    //  ___        _           _        
    // | __|_ _ __| |_ ___ _ _(_)___ ___
    // | _/ _` / _|  _/ _ \ '_| / -_|_-<
    // |_|\__,_\__|\__\___/_| |_\___/__/

}
//  ___       __ _                 
// |   \ ___ / _(_)_ _  ___ _ _ ___
// | |) / -_)  _| | ' \/ -_) '_(_-<
// |___/\___|_| |_|_||_\___|_| /__/
export const defineGraphDefinition = <
    Type extends Capitalize<string>,
    NodeDefinitionSet extends AnyNodeDefinitionSet,
>(
    type: Type,
    nodeDefinitionSet: NodeDefinitionSet,
) => {
    return new GraphDefinition(
        type,
        nodeDefinitionSet,
    )
}

