
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

export type UserNode = NodeShape<ConfiguredNodeDefinitionMap['User']> 
export type CompanyNode = NodeShape<ConfiguredNodeDefinitionMap['Company']> 
export type JobNode = NodeShape<ConfiguredNodeDefinitionMap['Job']> 

export type UserNodeState = NodeState<ConfiguredNodeDefinitionMap['User']> 
    export type BELONGS_TO_Company_Relationship = RelationshipMerge<
ConfiguredNodeDefinitionMap,
'User',
'BELONGS_TO'
>
export type POSTED_Job_Relationship = RelationshipMerge<
ConfiguredNodeDefinitionMap,
'User',
'POSTED'
>
export type SUPERVISOR_TO_User_Relationship = RelationshipMerge<
ConfiguredNodeDefinitionMap,
'User',
'SUPERVISOR_TO'
>
export type SWIPED_ON_Job_Relationship = RelationshipMerge<
ConfiguredNodeDefinitionMap,
'User',
'SWIPED_ON'
>
export type CompanyNodeState = NodeState<ConfiguredNodeDefinitionMap['Company']>
export type JobNodeState = NodeState<ConfiguredNodeDefinitionMap['Job']> 
    export type BELONGS_TO_Company_Relationship = RelationshipMerge<
ConfiguredNodeDefinitionMap,
'Job',
'BELONGS_TO'
>
