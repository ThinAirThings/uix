import { RelationshipUnion } from "../types/RelationshipUnion";
import { AnyNodeDefinitionMap, AnyNodeDefinitionSet, defineNode, NodeDefinition, NodeDefinitionMap } from "./NodeDefinition";
import { AnySubgraphNodeDefinitionSet, GenericSubgraphNodeDefinitionSet, SubgraphNodeDefinition } from "./SubgraphNodeDefinition";


export type SubgraphNodeDefinitionMap<NodeDefinitionSet extends AnySubgraphNodeDefinitionSet> = {
    [Type in NodeDefinitionSet[number]['nodeType']]: (NodeDefinitionSet[number] & { nodeType: Type });
};


export type GenericSubgraphDefinition = SubgraphDefinition<
    AnyNodeDefinitionMap,
    GenericSubgraphNodeDefinitionSet
>
export type AnySubgraphDefinition = SubgraphDefinition<any, any>
export class SubgraphDefinition<
    GraphNodeDefinitionMap extends AnyNodeDefinitionMap,
    NodeDefinitionSet extends AnySubgraphNodeDefinitionSet
>{
    constructor(
        private nodeDefinitionMap: GraphNodeDefinitionMap,
        private nodeDefinitionSet: NodeDefinitionSet,
        public subgraphNodeDefinitionMap: SubgraphNodeDefinitionMap<NodeDefinitionSet> = Object.fromEntries(
            nodeDefinitionSet.map(nodeDefinition => [nodeDefinition.nodeType, nodeDefinition])
        )
    ){}
    defineRelationship<
        NodeType extends NodeDefinitionSet[number]['nodeType'],
        Relationship extends RelationshipUnion<GraphNodeDefinitionMap, NodeType>
    >(
        nodeType: NodeType,
        relationship: Relationship
    ){
        const nodeDefinition = this.nodeDefinitionSet.find(node => node.nodeType === nodeType)!
        this.nodeDefinitionSet = [
            ...this.nodeDefinitionSet.filter(node => node.nodeType !== nodeType)
        ] as unknown as any
        return new SubgraphDefinition(
            this.nodeDefinitionMap,
            [
                ...this.nodeDefinitionSet,
                new SubgraphNodeDefinition(
                    nodeType,
                    [...nodeDefinition.subgraphRelationshipSet, relationship]
                ),
                new SubgraphNodeDefinition(
                    relationship.split('-')[2].replaceAll('>', '') as Relationship extends `-${string}->${infer NextNodeType}`
                        ? NextNodeType
                        : Relationship extends `<-${string}-${infer NextNodeType}`
                            ? NextNodeType
                            : never,
                    []
                )
            ],
        )
    }
}

