
// Start of File
import uixConfig from '../uix.config'
import { NodeShape, NodeState, GraphDefinition } from '@thinairthings/uix'

export const uixGraph = new GraphDefinition(uixConfig.type, uixConfig.nodeDefinitionSet)
export const nodeTypeMap = uixGraph.nodeTypeMap
export type ConfiguredNodeTypeMap = typeof nodeTypeMap
export type NodeKey<T extends keyof ConfiguredNodeTypeMap> = {
    nodeType: T
    nodeId: string
}

export type UserNode = NodeShape<ConfiguredNodeTypeMap['User']> 
export type OrganizationNode = NodeShape<ConfiguredNodeTypeMap['Organization']> 
export type ChatNode = NodeShape<ConfiguredNodeTypeMap['Chat']> 
export type MessageNode = NodeShape<ConfiguredNodeTypeMap['Message']> 

export type UserNodeState = NodeState<ConfiguredNodeTypeMap['User']> 
export type OrganizationNodeState = NodeState<ConfiguredNodeTypeMap['Organization']> 
export type ChatNodeState = NodeState<ConfiguredNodeTypeMap['Chat']> 
export type MessageNodeState = NodeState<ConfiguredNodeTypeMap['Message']> 

