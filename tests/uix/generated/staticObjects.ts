
// Start of File
import uixConfig from '../uix.config'
import { NodeShape, NodeState, GraphDefinition } from '@thinairthings/uix'

export const uixGraph = new GraphDefinition(uixConfig.type, uixConfig.nodeDefinitionSet)
export const nodeDefinitionMap = uixGraph.nodeDefinitionMap
export type ConfiguredNodeDefinitionMap = typeof nodeDefinitionMap
export type NodeKey<T extends keyof ConfiguredNodeDefinitionMap> = {
    nodeType: T
    nodeId: string
}

export type UserNode = NodeShape<ConfiguredNodeDefinitionMap['User']> 
export type OrganizationNode = NodeShape<ConfiguredNodeDefinitionMap['Organization']> 
export type ChatNode = NodeShape<ConfiguredNodeDefinitionMap['Chat']> 
export type MessageNode = NodeShape<ConfiguredNodeDefinitionMap['Message']> 
export type ProjectNode = NodeShape<ConfiguredNodeDefinitionMap['Project']> 

export type UserNodeState = NodeState<ConfiguredNodeDefinitionMap['User']> 
export type OrganizationNodeState = NodeState<ConfiguredNodeDefinitionMap['Organization']> 
export type ChatNodeState = NodeState<ConfiguredNodeDefinitionMap['Chat']> 
export type MessageNodeState = NodeState<ConfiguredNodeDefinitionMap['Message']> 
export type ProjectNodeState = NodeState<ConfiguredNodeDefinitionMap['Project']> 

