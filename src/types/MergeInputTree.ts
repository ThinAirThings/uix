import { AnyNodeDefinitionMap, NodeState } from "../definitions/NodeDefinition"
import { RelationshipState } from "../definitions/RelationshipDefinition"
import { NodeKey } from "./NodeKey"
import { RelationshipTypeUnion, RelationshipUnion } from "./RelationshipUnion"

export type DeepPartial<T> = {
    [P in keyof T]?: DeepPartial<T[P]>
}

/**
 * MergeInputTree is a wide type that represents the set of all possible subgraphs which 
 * can stem off the reference node defined by the NodeType.
 * This is used as the input type to the merge function and will be narrowed down to the 
 * resultant type of the input upon output.
 * 
 * Type Narrowing Example Reference:
 * @example
 * ```typescript
 * const constrain: <T extends string>(input: T): T => input
 * const a = constrain('a') // a: "a" (not string, but input is constrained to string)
 * ```
 */

export type MergeInputTree<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    NodeType extends keyof NodeDefinitionMap,
    NodeId extends string | undefined = undefined,
> =  ({
    nodeType: NodeType
    nodeId?: NodeId
    delete?: boolean
}) & (
    NodeId extends string 
        ? Partial<NodeState<NodeDefinitionMap, NodeType>>
        : NodeState<NodeDefinitionMap, NodeType>
) & {
    [RelationshipKey in RelationshipUnion<NodeDefinitionMap, NodeType>]?: {
        [nodeId: string]: {
            detach?: boolean
            delete?: boolean
        } & (
            RelationshipKey extends `-${
                infer RelationshipType extends RelationshipTypeUnion<NodeDefinitionMap, NodeType>&string
            }->${
                infer RelatedNodeType extends keyof NodeDefinitionMap&string
            }` ? Partial<RelationshipState<
                NodeDefinitionMap[NodeType]['relationshipDefinitionMap'][RelationshipType]
            >> & Omit<MergeInputTree<NodeDefinitionMap, RelatedNodeType, string>, 'nodeType' | 'nodeId'>
            : RelationshipKey extends `<-${
                infer RelationshipType extends RelationshipTypeUnion<NodeDefinitionMap, NodeType>&string
            }-${
                infer RelatedNodeType extends keyof NodeDefinitionMap&string
            }` ? Partial<RelationshipState<
                NodeDefinitionMap[RelatedNodeType]['relationshipDefinitionMap'][RelationshipType]
            >> & Omit<MergeInputTree<NodeDefinitionMap, RelatedNodeType, string>, 'nodeType' | 'nodeId'>
            : never
        )
    } 
}



// (NodeState<NodeDefinitionMap[NodeType]> & {
//         nodeType?: NodeType
//         nodeId?: string
//         delete?: boolean
//     } & {
//     [Relationship in RelationshipUnion<NodeDefinitionMap, NodeType>]?: (
//         Relationship extends `-${infer RelationshipType}->${infer RelatedNodeType}`
//         ? {
//             [id: string]: {
//                 detach?: boolean
//             } & RelationshipState<
//                 NodeDefinitionMap[NodeType]['relationshipDefinitionMap'][RelationshipType]
//             > & MergeInputTree<NodeDefinitionMap, RelatedNodeType>
//         }
//         : Relationship extends `<-${infer RelationshipType}-${infer RelatedNodeType}`
//             ? {
//                 [id: string]: {
//                     detach?: boolean
//                 }&RelationshipState<
//                     NodeDefinitionMap[RelatedNodeType]['relationshipDefinitionMap'][RelationshipType]
//                 > & MergeInputTree<NodeDefinitionMap, RelatedNodeType>
//             }
//             : never
//     )
// })