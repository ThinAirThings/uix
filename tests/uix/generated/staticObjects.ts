
// Start of File
import uixConfig from '../hb.uix.config'
import { NodeShape, NodeState, GraphDefinition, RelationshipState, RelationshipMerge } from '@thinairthings/uix'

export const uixGraph = new GraphDefinition(uixConfig.type, uixConfig.nodeDefinitionSet)
export const nodeDefinitionMap = uixGraph.nodeDefinitionMap
export type ConfiguredNodeDefinitionMap = typeof nodeDefinitionMap
export type NodeKey<T extends keyof ConfiguredNodeDefinitionMap> = {
    nodeType: T
    nodeId: string
}

export type UserNode = NodeShape<ConfiguredNodeDefinitionMap, 'User'> 
export type CompanyNode = NodeShape<ConfiguredNodeDefinitionMap, 'Company'> 
export type JobNode = NodeShape<ConfiguredNodeDefinitionMap, 'Job'> 
export type MessageNode = NodeShape<ConfiguredNodeDefinitionMap, 'Message'> 
export type ProjectNode = NodeShape<ConfiguredNodeDefinitionMap, 'Project'> 

export type UserNodeState = NodeState<ConfiguredNodeDefinitionMap, 'User'>
export type CompanyNodeState = NodeState<ConfiguredNodeDefinitionMap, 'Company'>
export type JobNodeState = NodeState<ConfiguredNodeDefinitionMap, 'Job'>
export type MessageNodeState = NodeState<ConfiguredNodeDefinitionMap, 'Message'>
export type ProjectNodeState = NodeState<ConfiguredNodeDefinitionMap, 'Project'>
