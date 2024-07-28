import { Inc } from "@thinairthings/utilities"
import { AnyNodeDefinitionMap } from "../definitions/NodeDefinition"
import { AnyExtractionNodeSet, ExtractionNode, RootExtractionNode } from "./ExtractionNode"
import { RelationshipUnion } from "./RelationshipUnion"
import { GenericRelationship, SubgraphSpecification } from "./SubgraphSpecification"
import { AnySubgraphSpecificationNode, AnySubgraphSpecificationNodeSet, SubgraphSpecificationNode } from "./SubgraphSpecificationNode"


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

export class ExtractionSubgraph<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    CurrentNodeIndex extends `n_${number}_${number}`,
    NodeSet extends AnySubgraphSpecificationNodeSet
> extends SubgraphSpecification<
    NodeDefinitionMap,
    CurrentNodeIndex,
    NodeSet
>{
    constructor(
        public nodeDefinitionMap: NodeDefinitionMap,
        public idxy: CurrentNodeIndex,
        public nodeSet: NodeSet
    ){super(
        nodeDefinitionMap,
        idxy,
        nodeSet
    )}
    addNode<
        Relationship extends RelationshipUnion<
            NodeDefinitionMap, 
            CurrentTargetNodeType<CurrentNodeIndex, NodeSet>
        >
    >(
        relationship: Relationship,
        options?: ExtractionOptions
    ) {
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
                new SubgraphSpecificationNode(
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