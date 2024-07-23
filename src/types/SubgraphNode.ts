import { AnyNodeDefinitionMap } from "../definitions/NodeDefinition";
import { AnyRelationshipDefinition } from "../definitions/RelationshipDefinition";
import { CollectOptions, NodeTypeByRelationshipType } from "./RelationshipCollectionMap";


type ThingUnion = 'Thing1' | 'Thing2' | 'Thing3'

export class SubgraphNode<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    RootNodeType extends keyof NodeDefinitionMap,
    RelatedSubgraph extends SubgraphNode<any, any, any, any> | null,
    NodeType extends keyof NodeDefinitionMap,
// RelationshipType extends 
> {
    constructor(
        public nodeDefinitionMap: NodeDefinitionMap,
        public rootNodeType: RootNodeType,
        public relatedSubgraph: RelatedSubgraph,
        public nodeType: NodeType
    ) { }
    get root(): RootSubgraphNode<NodeDefinitionMap, RootNodeType> {
        return (this.relatedSubgraph ? this.relatedSubgraph.root : this) as RootSubgraphNode<NodeDefinitionMap, RootNodeType>
    }
    branchTo<
        RelationshipType extends NodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number] extends (infer RelationshipDefinitionUnion extends AnyRelationshipDefinition | never)
        ? ((AnyRelationshipDefinition extends RelationshipDefinitionUnion
            ? RelationshipDefinitionUnion['type']
            : never
        ))
        : never,
        NextNodeType extends NodeTypeByRelationshipType<NodeDefinitionMap, NodeType, RelationshipType, 'to'>
    >(
        relationshipType: RelationshipType,
        nextNodeType: NextNodeType
    ) {
        return new SubgraphNode(
            this.nodeDefinitionMap,
            this.rootNodeType,
            this,
            nextNodeType
        )
    }
}

export class RootSubgraphNode<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    RootNodeType extends keyof NodeDefinitionMap,
> extends SubgraphNode<NodeDefinitionMap, RootNodeType, null, RootNodeType> {
    constructor(
        nodeDefinitionMap: NodeDefinitionMap,
        nodeType: RootNodeType,
    ) {
        super(nodeDefinitionMap, nodeType, null, nodeType)
    }
}
// export const createSubgraph = <
//     NodeDefinitionMap extends AnyNodeDefinitionMap,
//     NodeType extends keyof NodeDefinitionMap,
// >(
//     nodeDefinitionMap: NodeDefinitionMap,
//     nodeType: NodeType,
// ) => class Subgraph {

//     constructor(
//         public nodeDefinitionMap: NodeDefinitionMap,
//         public nodeType: NodeType,
//     ){}
//     [nodeDefinitionMap[nodeType].type]() {
//         return
//     }
// }