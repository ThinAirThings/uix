import { AnyNodeDefinitionMap } from "../definitions/NodeDefinition";
import { ExtractionOptions } from "./ExtractionSubgraph";
import { GenericRelationship } from "./SubgraphSpecification";



export type GenericExtractionNode = ExtractionNode<AnyNodeDefinitionMap, GenericRelationship, string, `n_${number}_${number}`>
export type AnyExtractionNode = ExtractionNode<any, any, any, any>
export type AnyExtractionNodeSet = readonly AnyExtractionNode[]
export class ExtractionNode<
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
        public options?: ExtractionOptions
    ){}
}

export class RootExtractionNode<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    NodeType extends keyof NodeDefinitionMap,
> extends ExtractionNode<
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

