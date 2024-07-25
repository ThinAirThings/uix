import { AnyNodeDefinitionMap } from "../definitions/NodeDefinition";
import { CollectOptions } from "./RelationshipCollectionMap";
import {Inc} from "@thinairthings/utilities"
import { RelationshipUnion } from "./RelationshipUnion";


type CurrentTargetNodeType<
    CurrentNodeIndex extends `n_${number}_${number}`,
    NodeSet extends AnyQueryNodeSet
> = CurrentNodeIndex extends `n_${number}_${0}` 
    ? (NodeSet[number] & {nodeIndex: `n_0_0`})['nodeType']
    : (NodeSet[number] & {nodeIndex: CurrentNodeIndex})['nodeType']

export type AnyQuerySubgraph = QuerySubgraph<any, any, any>
export class QuerySubgraph<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    CurrentNodeIndex extends `n_${number}_${number}`,
    NodeSet extends AnyQueryNodeSet
>{
    static create<
        NodeDefinitionMap extends AnyNodeDefinitionMap,
        NodeType extends keyof NodeDefinitionMap,
    >(nodeDefinitionMap: NodeDefinitionMap, nodeType: NodeType){
        return new QuerySubgraph(
            nodeDefinitionMap, 
            'n_0_0', 
            [new RootQueryNode(
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
            options?: CollectOptions;
        }) | (({
            [relationshipType: string]: TreeNode;
        }))
        const createPath = (x: number = 0, y: number = 1): TreeNode => {
            const node = this.nodeSet.find(node => node.nodeIndex === `n_${x}_${y}`);
            return node ? { [node.relationship.split('-')[0] === '<'
                ? `${node.relationship}-${node.nodeType}`
                : `-${node.relationship}${node.nodeType}`
            ]: { 
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
        return new QuerySubgraph(
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
        options?: CollectOptions
    ){
        const nextHopIdxy = this.idxy.split('_')
            .map((val, idx) => idx === 2 ? Number(val)+1 : val)
            .join('_') as (CurrentNodeIndex extends `n_${infer Idx extends number}_${infer Idy extends number}`? `n_${Idx}_${Inc<Idy>}` : never)
        
        const nodeType = relationship.split('-')[0] === '<'
            ? relationship.split('-')[2] as Relationship extends `<-${string}-${infer NodeType}` ? NodeType : never
            : relationship.split('-')[2].slice(1) as Relationship extends `-${string}->${infer NodeType}` ? NodeType : never
        return new QuerySubgraph(
            this.nodeDefinitionMap,
            nextHopIdxy,
            [
                ...this.nodeSet,
                new QueryNode(
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

export type AnyQueryNode = QueryNode<any, any, any, any>
export type AnyQueryNodeSet = readonly AnyQueryNode[]
export class QueryNode<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    Relationship extends string | null,
    NodeType extends keyof NodeDefinitionMap,
    NodeIndex extends `n_${number}_${number}`,
>{
    constructor(
        public nodeDefinitionMap: NodeDefinitionMap,
        public relationship: Relationship,
        public nodeType: NodeType,
        public nodeIndex: NodeIndex,
        public options?: CollectOptions
    ){}
}
export class RootQueryNode<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    NodeType extends keyof NodeDefinitionMap,
> extends QueryNode<
    NodeDefinitionMap,
    null,
    NodeType,
    'n_0_0'
>{
    constructor(
        nodeDefinitionMap: NodeDefinitionMap,
        nodeType: NodeType,
    ){
        super(nodeDefinitionMap, null, nodeType, 'n_0_0')
    }
}

