import { RelationshipUnion } from "../types/RelationshipUnion"
import { AnyNodeDefinitionMap } from "./NodeDefinition"



export type AnySubgraphNodeDefinitionSet = readonly AnySubgraphNodeDefinition[]
export type AnySubgraphNodeDefinition = SubgraphNodeDefinition<any, any, any>
export type GenericSubgraphNodeDefinitionSet = readonly GenericSubgraphNodeDefinition[]
export type GenericSubgraphNodeDefinition = SubgraphNodeDefinition<
    AnyNodeDefinitionMap, 
    keyof AnyNodeDefinitionMap, 
    RelationshipUnion<AnyNodeDefinitionMap, keyof AnyNodeDefinitionMap>[]
>
export class SubgraphNodeDefinition<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    NodeType extends keyof NodeDefinitionMap,
    SubgraphRelationshipSet extends readonly RelationshipUnion<NodeDefinitionMap, NodeType>[]
>{
    constructor(
        public nodeType: NodeType,
        public subgraphRelationshipSet: SubgraphRelationshipSet,
    ){}
}