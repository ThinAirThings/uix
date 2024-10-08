import { NextNodeTypeFromPath } from "../types/ExtractOutputTree";
import { RelationshipStateFromRelationshipString, RelationshipUnion } from "../types/RelationshipUnion";
import { AnyNodeDefinitionMap, NodeShape } from "./NodeDefinition";
import { RelationshipState } from "./RelationshipDefinition";
import { AnySubgraphPathDefinitionSet, GenericOptions, GenericSubgraphPathDefinitionSet, SubgraphPathDefinition } from "./SubgraphPathDefinition";


type NodeTypeFromRelationship<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    PathDefinitionSet extends AnySubgraphPathDefinitionSet,
    PathType extends PathDefinitionSet[number]['pathType'],
    Relationship extends RelationshipUnion<
        NodeDefinitionMap, 
        NextNodeTypeFromPath<NodeDefinitionMap, PathType>
    >
> = Relationship extends `-${string}->${infer NodeType extends keyof NodeDefinitionMap&string}`
? NodeType
: Relationship extends `<-${string}-${infer NodeType extends keyof NodeDefinitionMap&string}`
    ? NodeType
    : never

export type SubgraphPathDefinitionMap<PathDefinitionSet extends AnySubgraphPathDefinitionSet> = {
    [Type in PathDefinitionSet[number]['pathType']]: (PathDefinitionSet[number] & { pathType: Type });
};

export type GenericSubgraphDefinition = SubgraphDefinition<
    AnyNodeDefinitionMap,
    GenericSubgraphPathDefinitionSet
>
export type AnySubgraphDefinition = SubgraphDefinition<any, any>

export class SubgraphDefinition<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    PathDefinitionSet extends AnySubgraphPathDefinitionSet
>{
    constructor(
        public nodeDefinitionMap: NodeDefinitionMap,
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
            NodeDefinitionMap, 
            NextNodeTypeFromPath<NodeDefinitionMap, PathType>
        >
    >(
        pathType: PathType,
        relationship: Relationship,
        options?: {
            limit?: number
            offset?: number
        } & {
            [K in keyof NodeShape<NodeDefinitionMap, 
                NodeTypeFromRelationship<NodeDefinitionMap, PathDefinitionSet, PathType, Relationship>
            >]?: {
                exists?: boolean
                notEquals?: NodeShape<NodeDefinitionMap, NodeTypeFromRelationship<NodeDefinitionMap, PathDefinitionSet, PathType, Relationship>>[K]
                equals?: NodeShape<NodeDefinitionMap, NodeTypeFromRelationship<NodeDefinitionMap, PathDefinitionSet, PathType, Relationship>>[K]
                orderBy?: NodeShape<NodeDefinitionMap, NodeTypeFromRelationship<NodeDefinitionMap, PathDefinitionSet, PathType, Relationship>>[K] extends number ? 'asc' | 'desc' : never
            }
        } & {
            [K in keyof RelationshipStateFromRelationshipString<
                NodeDefinitionMap, 
                NextNodeTypeFromPath<NodeDefinitionMap, PathType>, 
                Relationship
            > as `rel_${K&string}`]?: {
                equals?: RelationshipStateFromRelationshipString<
                    NodeDefinitionMap, 
                    NextNodeTypeFromPath<NodeDefinitionMap, PathType>, 
                    Relationship
                >[K]
                orderBy?: RelationshipStateFromRelationshipString<
                    NodeDefinitionMap, 
                    NextNodeTypeFromPath<NodeDefinitionMap, PathType>, 
                    Relationship
                >[K] extends number ? 'asc' | 'desc' : never
            }
        }
    ){
        if (this.pathDefinitionSet.some(path => path.pathType === pathType+relationship)) return this
        const feedForwardOptions = this.pathDefinitionSet.find(node => node.pathType === pathType)?.options
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
                    [relationship] as const,
                    feedForwardOptions as GenericOptions
                ),
                new SubgraphPathDefinition(
                    this.nodeDefinitionMap,
                    pathType+relationship as `${PathType}${Relationship}`,
                    [] as const,
                    options as GenericOptions
                )
            ] as const,
        )
    }
}


type Thing = AnySubgraphPathDefinitionSet extends [] | AnySubgraphPathDefinitionSet ? true : false