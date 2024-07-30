import { NextNodeTypeFromPath } from "../fns/extractSubgraphFactory";
import { RelationshipUnion } from "../types/RelationshipUnion";
import { AnyNodeDefinitionMap } from "./NodeDefinition";
import { AnySubgraphPathDefinitionSet, GenericSubgraphPathDefinitionSet, SubgraphPathDefinition } from "./SubgraphPathDefinition";


export type SubgraphPathDefinitionMap<PathDefinitionSet extends AnySubgraphPathDefinitionSet> = {
    [Type in PathDefinitionSet[number]['pathType']]: (PathDefinitionSet[number] & { pathType: Type });
};

export type GenericSubgraphDefinition = SubgraphDefinition<
    AnyNodeDefinitionMap,
    GenericSubgraphPathDefinitionSet
>
export type AnySubgraphDefinition = SubgraphDefinition<any, any>
export class SubgraphDefinition<
    GraphNodeDefinitionMap extends AnyNodeDefinitionMap,
    PathDefinitionSet extends AnySubgraphPathDefinitionSet
>{
    constructor(
        public nodeDefinitionMap: GraphNodeDefinitionMap,
        public pathDefinitionSet: PathDefinitionSet,
        public subgraphPathDefinitionMap: SubgraphPathDefinitionMap<PathDefinitionSet> = Object.fromEntries(
            pathDefinitionSet.map(nodeDefinition => [nodeDefinition.pathType, nodeDefinition])
        )
    ){}
    serialize() {
        return {
            pathDefinitionSet: this.pathDefinitionSet.map(nodeDefinition => nodeDefinition.serialize()) as any,
            subgraphPathDefinitionMap: Object.fromEntries(
                this.pathDefinitionSet.map(nodeDefinition => [nodeDefinition.pathType, nodeDefinition.serialize()])
            )
        } as typeof this
    }
    extendPath<
        PathType extends PathDefinitionSet[number]['pathType'],
        Relationship extends RelationshipUnion<
            GraphNodeDefinitionMap, 
            NextNodeTypeFromPath<GraphNodeDefinitionMap, PathType>
        >
    >(
        pathType: PathType,
        relationship: Relationship
    ){
        const nodeDefinition = this.pathDefinitionSet.find(path => path.pathType === pathType)!
        this.pathDefinitionSet = [
            ...this.pathDefinitionSet.filter(node => node.pathType !== pathType)
        ] as any
        return new SubgraphDefinition(
            this.nodeDefinitionMap,
            [
                ...(this.pathDefinitionSet),
                new SubgraphPathDefinition(
                    this.nodeDefinitionMap,
                    pathType,
                    [relationship] as const
                ),
                new SubgraphPathDefinition(
                    this.nodeDefinitionMap,
                    pathType+relationship as `${PathType}${Relationship}`,
                    [] as const
                )
            ] as const,
        )
    }
}


type Thing = AnySubgraphPathDefinitionSet extends [] | AnySubgraphPathDefinitionSet ? true : false