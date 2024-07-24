import { AnyNodeDefinitionMap, NodeDefinition } from "../definitions/NodeDefinition";
import { AnyRelationshipDefinition, RelationshipDefinition } from "../definitions/RelationshipDefinition";
import { CollectOptions, NodeTypeByRelationshipType } from "./RelationshipCollectionMap";



export type AnyQueryPathNode = QueryPathNode<any, any, any, any, any, any>
export type AnyQueryPathNodeSet = readonly AnyQueryPathNode[]
export class QueryPathNode<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    RootNodeType extends keyof NodeDefinitionMap,
    RelationshipToParent extends string | null,
    NodeType extends keyof NodeDefinitionMap,
    ParentQueryPathNode extends AnyQueryPathNode | null,
    ChildQueryPathNodeSet extends AnyQueryPathNodeSet | [] = [],
> {
    constructor(
        public nodeDefinitionMap: NodeDefinitionMap,
        public rootNodeType: RootNodeType,
        public relationshipToParent: RelationshipToParent,
        public nodeType: NodeType,
        public parentQueryPathNode: ParentQueryPathNode,
        public childQueryPathNodeSet: ChildQueryPathNodeSet = [] as ChildQueryPathNodeSet,
        public options?: CollectOptions
    ) {}
    get root(): RootQueryPathNode < NodeDefinitionMap, RootNodeType > {
        return(this.parentQueryPathNode ? this.parentQueryPathNode.root : this) as RootQueryPathNode<NodeDefinitionMap, RootNodeType>
    }

    getQueryTree(): any {
        return {
            direction: this.relationshipToParent?.split('-')[0] === '<' ? 'from' : 'to',
            nodeType: this.nodeType,
            options: this.options,
            ...this.childQueryPathNodeSet.length ?
                Object.fromEntries(this.childQueryPathNodeSet.map(queryPathNode => 
                    [queryPathNode.relationshipToParent.split('-')[0] === '<' 
                        ? `${queryPathNode.relationshipToParent}-${queryPathNode.nodeType}`
                        : `-${queryPathNode.relationshipToParent}${queryPathNode.nodeType}`
                    , queryPathNode.getQueryTree()]
                ))
                : {}
        }
    }

    hop <
        Relationship extends (
            (NodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number] extends (infer RelationshipDefinitionUnion extends AnyRelationshipDefinition | never)
                ? AnyRelationshipDefinition extends RelationshipDefinitionUnion
                    ? {
                        [RelationshipType in RelationshipDefinitionUnion['type']]: NodeType extends (RelationshipDefinitionUnion & { type: RelationshipType })['fromNodeDefinition']['type']
                            ? `${RelationshipType}->`
                            : never
                    }[RelationshipDefinitionUnion['type']]
                    : never
                : never
        ) | (
            NodeDefinitionMap[keyof NodeDefinitionMap]['relationshipDefinitionSet'][number] extends (infer RelationshipDefinitionUnion extends AnyRelationshipDefinition | never)
                ? AnyRelationshipDefinition extends RelationshipDefinitionUnion
                    ? {
                        [RelationshipType in RelationshipDefinitionUnion['type']]: NodeType extends (RelationshipDefinitionUnion&{type: RelationshipType})['toNodeDefinition']['type']
                        ? `<-${RelationshipType}`
                        : never
                    }[RelationshipDefinitionUnion['type']]
                    : never
                : never
        )),
        NextNodeType extends Relationship extends `${infer RelationshipType}->` 
            ? NodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number] extends (infer RelationshipDefinitionUnion extends AnyRelationshipDefinition | never)
                ? AnyRelationshipDefinition extends RelationshipDefinitionUnion
                    ? (RelationshipDefinitionUnion & { type: RelationshipType })['toNodeDefinition']['type']
                    : never
                : never
            : Relationship extends `<-${infer RelationshipType}`
                ? NodeDefinitionMap[keyof NodeDefinitionMap]['relationshipDefinitionSet'][number] extends (infer RelationshipDefinitionUnion extends AnyRelationshipDefinition | never)
                    ? AnyRelationshipDefinition extends RelationshipDefinitionUnion
                        ? (RelationshipDefinitionUnion & {type: RelationshipType})['fromNodeDefinition']['type']
                        : never
                    : never
                : never,
    > (
        relationship: Relationship,
        nodeType: NextNodeType,
        options?: CollectOptions
    ) {
        const newQueryPathNode = new QueryPathNode(
            this.nodeDefinitionMap,
            this.rootNodeType,
            relationship,
            nodeType,
            this,
            [],
            options
        )
        const thisNode = new QueryPathNode(
            this.nodeDefinitionMap,
            this.rootNodeType,
            this.relationshipToParent,
            this.nodeType,
            this.parentQueryPathNode,
            [
                ...(this.childQueryPathNodeSet), 
                newQueryPathNode
            ] as const,
        )
        this.parentQueryPathNode?.childQueryPathNodeSet.push(thisNode)
        const childNode = thisNode.childQueryPathNodeSet.find(childQueryNode => childQueryNode.nodeType === newQueryPathNode.nodeType)!
        return childNode._defineParentQueryPathNode(thisNode)
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
