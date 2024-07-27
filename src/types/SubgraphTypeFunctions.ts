import { Dec, Inc } from "@thinairthings/utilities"
import { AnyNodeDefinitionMap, NodeShape, NodeState } from "../definitions/NodeDefinition"
import { AnyRelationshipDefinition, RelationshipShape, RelationshipState } from "../definitions/RelationshipDefinition"
import { AnySubgraphSpecification } from "./SubgraphSpecification"



type RangeLimit = 0 | 1 | 2 | 3 

export type SubgraphPath<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    Subgraph extends AnySubgraphSpecification, 
    X extends number = 0, 
    Y extends number = 1
> = `n_${X}_${Y}` extends Subgraph['nodeSet'][number]['nodeIndex']
        ? ({
            [Relationship in (Subgraph['nodeSet'][number] & {nodeIndex: `n_${X}_${Y}`})['relationship']]: 
                Relationship extends `-${infer RelationshipType}->${infer NextNodeType}`
                    ? (NodeDefinitionMap[(Subgraph['nodeSet'][number] & {nodeIndex: `n_${Dec<Y> extends 0 ? 0 : X}_${Dec<Y>}`})['nodeType']]['relationshipDefinitionSet'][number]) extends (infer RelationshipUnionRef extends AnyRelationshipDefinition | never)
                        ? AnyRelationshipDefinition extends RelationshipUnionRef
                            ? (RelationshipUnionRef & { type: RelationshipType })['cardinality'] extends `${string}-to-many`
                                ? (
                                    NodeState<NodeDefinitionMap[NextNodeType]>
                                    & RelationshipState<(NodeDefinitionMap[(Subgraph['nodeSet'][number] & {nodeIndex: `n_${Dec<Y> extends 0 ? 0 : X}_${Dec<Y>}`})['nodeType']]['relationshipDefinitionSet'][number]&{type: RelationshipType})>
                                    & SubgraphPath<NodeDefinitionMap, Subgraph, X, Inc<Y>>
                                )[]
                                : (
                                    NodeState<NodeDefinitionMap[NextNodeType]>
                                    & RelationshipState<(NodeDefinitionMap[(Subgraph['nodeSet'][number] & {nodeIndex: `n_${Dec<Y> extends 0 ? 0 : X}_${Dec<Y>}`})['nodeType']]['relationshipDefinitionSet'][number]&{type: RelationshipType})>
                                    & SubgraphPath<NodeDefinitionMap, Subgraph, X, Inc<Y>>
                                )
                            : never
                        : never
                : Relationship extends `<-${infer RelationshipType}-${infer NextNodeType}`
                    ? (NodeDefinitionMap[NextNodeType]['relationshipDefinitionSet'][number]) extends (infer RelationshipUnionRef extends AnyRelationshipDefinition | never)
                        ? AnyRelationshipDefinition extends RelationshipUnionRef
                            ? (RelationshipUnionRef & { type: RelationshipType })['cardinality'] extends `many-to-${string}`
                                ? (
                                    NodeState<NodeDefinitionMap[NextNodeType]>
                                    & RelationshipState<(NodeDefinitionMap[NextNodeType]['relationshipDefinitionSet'][number]&{type: RelationshipType})>
                                    & SubgraphPath<NodeDefinitionMap, Subgraph, X, Inc<Y>>
                                )[]
                                : (
                                    NodeState<NodeDefinitionMap[NextNodeType]>
                                    & RelationshipState<(NodeDefinitionMap[NextNodeType]['relationshipDefinitionSet'][number]&{type: RelationshipType})>
                                    & SubgraphPath<NodeDefinitionMap, Subgraph, X, Inc<Y>>
                                )
                            : never
                        : never
                    : never
        })
        : unknown


export type SubgraphTree<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    Subgraph extends AnySubgraphSpecification, 
    X extends number = 0
> = X extends RangeLimit
    ? SubgraphPath<NodeDefinitionMap, Subgraph> & (`n_${X}_${1}` extends Subgraph['nodeSet'][number]['nodeIndex']
        ? SubgraphPath<NodeDefinitionMap, Subgraph, X> & SubgraphTree<NodeDefinitionMap, Subgraph, Inc<X>> 
        : unknown
    )
    :X