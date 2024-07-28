

import { AnyNodeDefinitionMap } from "../definitions/NodeDefinition";
import { GenericRelationship } from "./SubgraphSpecification";

export type GenericSubgraphSpecificationNode = SubgraphSpecificationNode<AnyNodeDefinitionMap, GenericRelationship, string, `n_${number}_${number}`, any>
export type AnySubgraphSpecificationNode = SubgraphSpecificationNode<any, any, any, any, any>
export type AnySubgraphSpecificationNodeSet = readonly AnySubgraphSpecificationNode[]
export class SubgraphSpecificationNode<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    Relationship extends string | null,
    NodeType extends keyof NodeDefinitionMap,
    NodeIndex extends `n_${number}_${number}`,
    Options extends Record<string, any> | undefined = undefined,
>{
    constructor(
        public nodeDefinitionMap: NodeDefinitionMap,
        public relationship: Relationship,
        public nodeType: NodeType,
        public nodeIndex: NodeIndex,
        public options?: Options,
    ){}
}
export class RootSubgraphSpecificationNode<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    NodeType extends keyof NodeDefinitionMap,
> extends SubgraphSpecificationNode<
    NodeDefinitionMap,
    null,
    NodeType,
    'n_0_0',
    {}
>{
    constructor(
        nodeDefinitionMap: NodeDefinitionMap,
        nodeType: NodeType,
    ){
        super(nodeDefinitionMap, null, nodeType, 'n_0_0', {})
    }
}