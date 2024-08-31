import { extend } from "lodash"
import { AnyNodeDefinitionMap, NodeState } from "../definitions/NodeDefinition"
import { RelationshipState } from "../definitions/RelationshipDefinition"
import { MergeInputTree } from "./MergeInputTree"
import { NodeKey } from "./NodeKey"
import { RelationshipTypeUnion, RelationshipUnion } from "./RelationshipUnion"


export type DerivedDraftInputTree<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    NodeType extends keyof NodeDefinitionMap,
> = Partial<NodeState<NodeDefinitionMap, NodeType>> & {
    [RelationshipKey in RelationshipUnion<NodeDefinitionMap, NodeType>]?: {
        [nodeId: string]: {
            detach?: boolean
            delete?: boolean
        } & (
            RelationshipKey extends `-${
                infer RelationshipType extends RelationshipTypeUnion<NodeDefinitionMap, NodeType>&string
            }->${
                infer RelatedNodeType extends keyof NodeDefinitionMap&string
            }` ? RelationshipState<
                NodeDefinitionMap[NodeType]['relationshipDefinitionMap'][RelationshipType]
            > & MergeInputTree<NodeDefinitionMap, RelatedNodeType> 
            : RelationshipKey extends `<-${
                infer RelationshipType extends RelationshipTypeUnion<NodeDefinitionMap, NodeType>&string
            }-${
                infer RelatedNodeType extends keyof NodeDefinitionMap&string
            }` ? RelationshipState<
                NodeDefinitionMap[RelatedNodeType]['relationshipDefinitionMap'][RelationshipType]
            > & MergeInputTree<NodeDefinitionMap, RelatedNodeType>
            : never
        )
    } 
}



type Thing = 'a' | 'b' | 'c'
type YesOrNo = 'a' extends Thing ? 'yes' : 'no'
// Partial<NodeState<NodeDefinitionMap, NodeType>> & {
//     [RelationshipKey in RelationshipUnion<NodeDefinitionMap, NodeType>]?: ({
//         [nodeId: string]: (
//             RelationshipKey extends `-${
//                 infer RelationshipType extends RelationshipTypeUnion<NodeDefinitionMap, NodeType>&string
//             }->${
//                 infer RelatedNodeType extends keyof NodeDefinitionMap&string
//             }` ? Partial<RelationshipState<
//                 NodeDefinitionMap[NodeType]['relationshipDefinitionMap'][RelationshipType]
//             >> & DerivedDraftInputTree<NodeDefinitionMap, RelatedNodeType, NodeKey<NodeDefinitionMap, RelatedNodeType>>
//             : RelationshipKey extends `<-${
//                 infer RelationshipType extends RelationshipTypeUnion<NodeDefinitionMap, NodeType>&string
//             }-${
//                 infer RelatedNodeType extends keyof NodeDefinitionMap&string
//             }` ? Partial<RelationshipState<
//                 NodeDefinitionMap[RelatedNodeType]['relationshipDefinitionMap'][RelationshipType]
//             >> & DerivedDraftInputTree<NodeDefinitionMap, RelatedNodeType, NodeKey<NodeDefinitionMap, RelatedNodeType>>
//             : never
//         )
//     })
// }
