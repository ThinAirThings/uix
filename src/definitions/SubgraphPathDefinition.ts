import { NextNodeTypeFromPath } from "../fns/extractSubgraphFactoryv2"
import { RelationshipUnion } from "../types/RelationshipUnion"
import { AnyNodeDefinitionMap } from "./NodeDefinition"



export type AnySubgraphPathDefinitionSet = readonly AnySubgraphPathDefinition[]
export type AnySubgraphPathDefinition = SubgraphPathDefinition<any, any, any>
export type GenericSubgraphPathDefinitionSet = readonly GenericSubgraphPathDefinition[]
export type GenericSubgraphPathDefinition = SubgraphPathDefinition<
    AnyNodeDefinitionMap, 
    keyof AnyNodeDefinitionMap, 
    RelationshipUnion<AnyNodeDefinitionMap, keyof AnyNodeDefinitionMap>[]
>
export class SubgraphPathDefinition<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    PathType extends 
        | keyof NodeDefinitionMap 
        | `<-${string}-${keyof NodeDefinitionMap&string}` 
        | `${string}->${keyof NodeDefinitionMap&string}`,
    SubgraphRelationshipSet extends readonly RelationshipUnion<
        NodeDefinitionMap, 
        NextNodeTypeFromPath<NodeDefinitionMap, PathType>
    >[]
>{
    constructor(
        public nodeDefinitionMap: NodeDefinitionMap,
        public pathType: PathType,
        public subgraphRelationshipSet: SubgraphRelationshipSet,
    ){}
}