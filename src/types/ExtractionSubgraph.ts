import { Inc } from "@thinairthings/utilities"
import { AnyNodeDefinitionMap } from "../definitions/NodeDefinition"
import { AnyExtractionNodeSet, ExtractionNode, RootExtractionNode } from "./ExtractionNode"
import { RelationshipUnion } from "./RelationshipUnion"


type CurrentTargetNodeType<
    CurrentNodeIndex extends `n_${number}_${number}`,
    NodeSet extends AnyExtractionNodeSet
> = CurrentNodeIndex extends `n_${number}_${0}` 
    ? (NodeSet[number] & {nodeIndex: `n_0_0`})['nodeType']
    : (NodeSet[number] & {nodeIndex: CurrentNodeIndex})['nodeType']


export type ExtractionOptions = {
    limit?: number
    page?: number
    orderBy?: 'updatedAt' | 'createdAt';
    orderDirection?: 'ASC' | 'DESC';
}

export type AnyExtractionSubgraph = ExtractionSubgraph<any, any, any>
export class ExtractionSubgraph<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    CurrentNodeIndex extends `n_${number}_${number}`,
    NodeSet extends AnyExtractionNodeSet
>{
    static create<
        NodeDefinitionMap extends AnyNodeDefinitionMap,
        NodeType extends keyof NodeDefinitionMap,
    >(nodeDefinitionMap: NodeDefinitionMap, nodeType: NodeType){
        return new ExtractionSubgraph(
            nodeDefinitionMap, 
            'n_0_0', 
            [new RootExtractionNode(
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
    getQueryTree(){
        type TreeNode = ({
            nodeType: string;
            direction: 'from' | 'to';
            options?: ExtractionOptions;
        }) | (({
            [relationshipType: GenericRelationship]: TreeNode;
        }))
        const createPath = (x: number = 0, y: number = 1): TreeNode => {
            const node = this.nodeSet.find(node => node.nodeIndex === `n_${x}_${y}`);
            return node ? { [node.relationship]: { 
                ...createPath(x, y + 1), 
                nodeType: node.nodeType,
                direction: node.relationship.split('-')[0] === '<' ? 'from' : 'to',
                options: node.options
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
            nodeType: this.nodeSet[0].nodeType,
            options : this.nodeSet[0].options
        }
    }
    root(){
        return new ExtractionSubgraph(
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
        options?: ExtractionOptions
    ){
        const nextHopIdxy = this.idxy.split('_')
            .map((val, idx) => idx === 2 ? Number(val)+1 : val)
            .join('_') as (CurrentNodeIndex extends `n_${infer Idx extends number}_${infer Idy extends number}`? `n_${Idx}_${Inc<Idy>}` : never)
        
        const nodeType = relationship.split('-')[0] === '<'
            ? relationship.split('-')[2] as Relationship extends `<-${string}-${infer NodeType}` ? NodeType : never
            : relationship.split('-')[2].slice(1) as Relationship extends `-${string}->${infer NodeType}` ? NodeType : never
        return new ExtractionSubgraph(
            this.nodeDefinitionMap,
            nextHopIdxy,
            [
                ...this.nodeSet,
                new ExtractionNode(
                    this.nodeDefinitionMap,
                    relationship,
                    nodeType,
                    nextHopIdxy,
                    options
                )
            ] as const
        )
    }
}