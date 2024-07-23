import { AnyNodeDefinitionMap } from "../definitions/NodeDefinition";
import { AnyRelationshipDefinition, RelationshipDefinition } from "../definitions/RelationshipDefinition";
import { CollectOptions, NodeTypeByRelationshipType } from "./RelationshipCollectionMap";


type ThingUnion = 'Thing1' | 'Thing2' | 'Thing3'

export type NodeTypeByDirection<
    Direction extends '<-' | '->',
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    NodeType extends keyof NodeDefinitionMap,
> = Direction extends '->'
    ? NodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number] extends (infer RelationshipDefinitionUnion extends AnyRelationshipDefinition | never)
        ? AnyRelationshipDefinition extends RelationshipDefinitionUnion 
            ? RelationshipDefinitionUnion['toNodeDefinition']['type'] 
            : never
        : never
    : NodeDefinitionMap[keyof NodeDefinitionMap]['relationshipDefinitionSet'][number] extends (infer RelationshipDefinitionUnion extends AnyRelationshipDefinition | never)
        ? AnyRelationshipDefinition extends RelationshipDefinitionUnion
            ? {
                [RelationshipType in RelationshipDefinitionUnion['type']]: NodeType extends (RelationshipDefinitionUnion & { type: RelationshipType })['toNodeDefinition']['type']
                    ? (RelationshipDefinitionUnion & { type: RelationshipType })['fromNodeDefinition']['type']
                    : never
            }[RelationshipDefinitionUnion['type']]
            : never
        : never

class SubgraphNode<
        NodeDefinitionMap extends AnyNodeDefinitionMap,
        RootNodeType extends keyof NodeDefinitionMap,
        RelatedSubgraph extends SubgraphNode<any, any, any, any, any> | null,
        NodeType extends keyof NodeDefinitionMap,
        HopSet extends readonly [string, {
            relationshipType: string,
            direction: 'to' | 'from',
            nodeType: NodeType,
            next: HopSet
        }][]
    > {
    constructor(
        public nodeDefinitionMap: NodeDefinitionMap,
        public rootNodeType: RootNodeType,
        public relatedSubgraph: RelatedSubgraph,
        public nodeType: NodeType,
        public hopSet: HopSet
    ) { }
    get root(): RootSubgraphNode < NodeDefinitionMap, RootNodeType > {
        return(this.relatedSubgraph ? this.relatedSubgraph.root : this) as RootSubgraphNode<NodeDefinitionMap, RootNodeType>
    }
    hop <
        Direction extends '<-' | '->',
        NextNodeType extends NodeTypeByDirection<Direction, NodeDefinitionMap, NodeType>,
        ViaRelationshipType extends Direction extends '->'
            ? NodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number] extends (infer RelationshipDefinitionUnion extends AnyRelationshipDefinition | never)
            ? AnyRelationshipDefinition extends RelationshipDefinitionUnion
                ? {
                    [RelationshipType in RelationshipDefinitionUnion['type']]: NextNodeType extends (RelationshipDefinitionUnion & { type: RelationshipType })['toNodeDefinition']['type']
                        ? RelationshipType
                        : never
                }[RelationshipDefinitionUnion['type']]
                : never
            : never
            : NodeDefinitionMap[NextNodeType]['relationshipDefinitionSet'][number] extends (infer RelationshipDefinitionUnion extends AnyRelationshipDefinition | never)
                ? AnyRelationshipDefinition extends RelationshipDefinitionUnion
                    ? {
                        [RelationshipType in RelationshipDefinitionUnion['type']]: NodeType extends (RelationshipDefinitionUnion & { type: RelationshipType })['toNodeDefinition']['type']
                            ? RelationshipType
                            : never
                    }[RelationshipDefinitionUnion['type']]
                    : never
                : never
    > (
        direction: Direction,
        nodeType: NextNodeType,
        relationshipType: ViaRelationshipType
    ) { 
        return new SubgraphNode(
            this.nodeDefinitionMap,
            this.rootNodeType,
            this,
            nodeType,
            [
                ...this.hopSet as HopSet,
                // [direction, {
                //     relationshipType: params.via,
                //     direction: direction,
                //     nodeType: nodeType,
                //     next: [] as HopSet
                // }]
            ]
        )
    }
}

export class Hop<
    NodeTypeMap extends AnyNodeDefinitionMap,
    ParentHop extends Hop<any, any, any> | null,
    RelationshipType extends NodeTypeMap[keyof NodeTypeMap]['relationshipDefinitionSet'][number]['type'],
> {
    constructor(
        public nodeTypeMap: NodeTypeMap,
        public relationshipType: RelationshipType,

    ) { }
}

export class RootSubgraphNode<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    RootNodeType extends keyof NodeDefinitionMap,
> extends SubgraphNode<NodeDefinitionMap, RootNodeType, null, RootNodeType, []> {
    constructor(
        nodeDefinitionMap: NodeDefinitionMap,
        nodeType: RootNodeType,
    ) {
        super(nodeDefinitionMap, nodeType, null, nodeType, [])
    }
}

// export const createRootSubgraphNode = <
//     NodeDefinitionMap extends AnyNodeDefinitionMap,
//     RootNodeType extends keyof NodeDefinitionMap,
// >(
//     nodeDefinitionMap: NodeDefinitionMap,
//     nodeType: RootNodeType,
// ) => new RootSubgraphNode(
//     nodeDefinitionMap,
//     nodeType,
// ) as RootSubgraphNode<NodeDefinitionMap, RootNodeType>
//     & RelationshipTypes<NodeDefinitionMap, RootNodeType, null, RootNodeType>




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