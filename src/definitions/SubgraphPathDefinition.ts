import { NextNodeTypeFromPath } from "../types/ExtractOutputTree"
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
export type FilterKeys = 'equals'
export type GenericOptions = Record<string, {
    [K in FilterKeys]: string | number | boolean | null
}>
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
        public options?: GenericOptions
    ){}
    serialize() {
        return {
            pathType: this.pathType,
            subgraphRelationshipSet: this.subgraphRelationshipSet,
            options: this.options
        } as typeof this
    }
}