import { AnyNodeDefinitionMap } from "../definitions/NodeDefinition";
import { AnyRelationshipDefinition, RelationshipDefinition } from "../definitions/RelationshipDefinition";
import { CollectOptions, NodeTypeByRelationshipType } from "./RelationshipCollectionMap";


export type NodeTypeByDirection<
    Direction extends 'to' | 'from',
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    NodeType extends keyof NodeDefinitionMap,
> = Direction extends 'to'
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

export class QueryPathNode<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    RootNodeType extends keyof NodeDefinitionMap,
    RelationshipToParent extends string | null,
    NodeType extends keyof NodeDefinitionMap,
    ParentQueryPathNode extends QueryPathNode<any, any, any, any, any, any> | null,
    ChildQueryPathNodeSet extends readonly QueryPathNode<any, any, any, any, any, any>[] | [],
> {
    constructor(
        public nodeDefinitionMap: NodeDefinitionMap,
        public rootNodeType: RootNodeType,
        public relationshipToParent: RelationshipToParent,
        public nodeType: NodeType,
        public parentQueryPathNode: ParentQueryPathNode,
        public childQueryPathNodeSet: ChildQueryPathNodeSet,
    ) { }
    get root(): RootQueryPathNode < NodeDefinitionMap, RootNodeType > {
        return(this.parentQueryPathNode ? this.parentQueryPathNode.root : this) as RootQueryPathNode<NodeDefinitionMap, RootNodeType>
    }
    _defineParentQueryPathNode<
        ParentQueryPathNode extends QueryPathNode<any, any, any, any, any, any>,
    >(
        parentQueryPathNode: ParentQueryPathNode,
    ) {
        return new QueryPathNode(
            this.nodeDefinitionMap,
            this.rootNodeType,
            this.relationshipToParent,
            this.nodeType,
            parentQueryPathNode,
            this.childQueryPathNodeSet,
        )
    }
    getQueryTree(): any {
        if (this.nodeType === 'Organization'){
            console.log(this.childQueryPathNodeSet)
        }
        return {
            nodeType: this.nodeType,
            relationshipToParent: this.relationshipToParent,
            ...this.childQueryPathNodeSet.length ?
                Object.fromEntries(this.childQueryPathNodeSet.map(queryPathNode => [queryPathNode.relationshipToParent, queryPathNode.getQueryTree()]))
                : {}
        }
    }
    hop <
        Direction extends 'to' | 'from',
        NextNodeType extends NodeTypeByDirection<Direction, NodeDefinitionMap, NodeType>,
        ViaRelationshipType extends Direction extends 'to'
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
        const newQueryPathNode = new QueryPathNode(
            this.nodeDefinitionMap,
            this.rootNodeType,
            relationshipType,
            nodeType,
            this,
            [],
        )
        const thisNode = new QueryPathNode(
            this.nodeDefinitionMap,
            this.rootNodeType,
            this.relationshipToParent,
            this.nodeType,
            this.parentQueryPathNode,
            [...this.childQueryPathNodeSet, newQueryPathNode],
        )
        this.parentQueryPathNode?.childQueryPathNodeSet.push(thisNode)
        const childNode = thisNode.childQueryPathNodeSet.find(childQueryNode => childQueryNode.nodeType === newQueryPathNode.nodeType)
        return childNode!._defineParentQueryPathNode(thisNode)
    }  
}

export class RootQueryPathNode<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    RootNodeType extends keyof NodeDefinitionMap,
> extends QueryPathNode<NodeDefinitionMap, RootNodeType, null, RootNodeType, null, []> {
    constructor(
        nodeDefinitionMap: NodeDefinitionMap,
        nodeType: RootNodeType,
    ) {
        super(nodeDefinitionMap, nodeType, null, nodeType, null, [])
    }
}
