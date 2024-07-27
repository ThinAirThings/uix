import { Inc } from "@thinairthings/utilities";
import { AnyNodeDefinitionMap } from "../definitions/NodeDefinition";
import { RelationshipUnion } from "./RelationshipUnion";
import { AnySubgraphSpecificationNodeSet, RootSubgraphSpecificationNode, SubgraphSpecificationNode } from "./SubgraphSpecificationNode";


export type GenericRelationship = `<-${string}-${string}` | `-${string}->${string}`
type CurrentTargetNodeType<
    CurrentNodeIndex extends `n_${number}_${number}`,
    NodeSet extends AnySubgraphSpecificationNodeSet
> = CurrentNodeIndex extends `n_${number}_${0}` 
    ? (NodeSet[number] & {nodeIndex: `n_0_0`})['nodeType']
    : (NodeSet[number] & {nodeIndex: CurrentNodeIndex})['nodeType']


export type StartingSubgraphSpecification<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    NodeType extends keyof NodeDefinitionMap,
> = SubgraphSpecification<NodeDefinitionMap, `n_0_0`, readonly [
    RootSubgraphSpecificationNode<NodeDefinitionMap, NodeType>
]>

export type AnySubgraphSpecification = SubgraphSpecification<any, any, any>

export class SubgraphSpecification<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    CurrentNodeIndex extends `n_${number}_${number}`,
    NodeSet extends AnySubgraphSpecificationNodeSet
>{
    static create<
        NodeDefinitionMap extends AnyNodeDefinitionMap,
        NodeType extends keyof NodeDefinitionMap,
    >(nodeDefinitionMap: NodeDefinitionMap, nodeType: NodeType){
        return new SubgraphSpecification(
            nodeDefinitionMap, 
            'n_0_0', 
            [new RootSubgraphSpecificationNode(
                nodeDefinitionMap,
                nodeType
            )] as const
        )
    }
    constructor(
        public nodeDefinitionMap: NodeDefinitionMap,
        public idxy: CurrentNodeIndex,
        public nodeSet: NodeSet
    ){}
    getSubgraphTree(){
        type TreeNode = ({
            nodeType: string;
            direction: 'from' | 'to';
        }) | (({
            [relationshipType: GenericRelationship]: TreeNode;
        }))
        const createPath = (x: number = 0, y: number = 1): TreeNode => {
            const node = this.nodeSet.find(node => node.nodeIndex === `n_${x}_${y}`);
            return node ? { [node.relationship]: { 
                ...createPath(x, y + 1), 
                nodeType: node.nodeType,
                direction: node.relationship.split('-')[0] === '<' ? 'from' : 'to',
            } } : {};
        }
        const createTree = (x: number = 0): TreeNode => {
            if (!this.nodeSet.find(node => node.nodeIndex === `n_${x}_1`)) return {};
            return {
                ...createPath(x), 
                ...createTree(x + 1) 
            };
        }
        return {
            ...createTree(),
            nodeType: this.nodeSet[0].nodeType
        }
    }
    root(){
        return new SubgraphSpecification(
            this.nodeDefinitionMap,
            this.idxy.split('_')
                .map((val, idx) => idx === 1 ? Number(val)+1 : idx === 2 ? 0 : val)
                .join('_') as (CurrentNodeIndex extends `n_${infer Idx extends number}_${number}`? `n_${Inc<Idx>}_${0}` : never),
            this.nodeSet
        )
    }
    addNode<
        Relationship extends RelationshipUnion<
            NodeDefinitionMap, 
            CurrentTargetNodeType<CurrentNodeIndex, NodeSet>
        >
    >(
        relationship: Relationship,
    ){
        const nextHopIdxy = this.idxy.split('_')
            .map((val, idx) => idx === 2 ? Number(val)+1 : val)
            .join('_') as (CurrentNodeIndex extends `n_${infer Idx extends number}_${infer Idy extends number}`? `n_${Idx}_${Inc<Idy>}` : never)
        
        const nodeType = relationship.split('-')[0] === '<'
            ? relationship.split('-')[2] as Relationship extends `<-${string}-${infer NodeType}` ? NodeType : never
            : relationship.split('-')[2].slice(1) as Relationship extends `-${string}->${infer NodeType}` ? NodeType : never
        return new SubgraphSpecification(
            this.nodeDefinitionMap,
            nextHopIdxy,
            [
                ...this.nodeSet,
                new SubgraphSpecificationNode(
                    this.nodeDefinitionMap,
                    relationship,
                    nodeType,
                    nextHopIdxy,
                )
            ] as const
        )
    }
}