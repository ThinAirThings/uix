
// Start of File
import uixConfig from '../uix.config'
import { NodeShape, NodeState, GraphDefinition, RelationshipState } from '@thinairthings/uix'

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
export type KanbanNode = NodeShape<ConfiguredNodeDefinitionMap['Kanban']> 
export type TaskNode = NodeShape<ConfiguredNodeDefinitionMap['Task']> 
export type CommentNode = NodeShape<ConfiguredNodeDefinitionMap['Comment']> 

export type UserNodeState = NodeState<ConfiguredNodeDefinitionMap['User']> 
export type ACCESS_TO_Organization_Relationship = {fromNodeId: string}&RelationshipState<ConfiguredNodeDefinitionMap['User']['relationshipDefinitionMap']['ACCESS_TO']>
export type ACCESS_TO_Project_Relationship = {fromNodeId: string}&RelationshipState<ConfiguredNodeDefinitionMap['User']['relationshipDefinitionMap']['ACCESS_TO']>
export type OrganizationNodeState = NodeState<ConfiguredNodeDefinitionMap['Organization']>
export type ChatNodeState = NodeState<ConfiguredNodeDefinitionMap['Chat']> 
export type CONVERSATION_BETWEEN_User_Relationship = {fromNodeId: string}&RelationshipState<ConfiguredNodeDefinitionMap['Chat']['relationshipDefinitionMap']['CONVERSATION_BETWEEN']>
export type MessageNodeState = NodeState<ConfiguredNodeDefinitionMap['Message']> 
export type SENT_IN_Chat_Relationship = {fromNodeId: string}&RelationshipState<ConfiguredNodeDefinitionMap['Message']['relationshipDefinitionMap']['SENT_IN']>
export type SENT_BY_User_Relationship = {fromNodeId: string}&RelationshipState<ConfiguredNodeDefinitionMap['Message']['relationshipDefinitionMap']['SENT_BY']>
export type ProjectNodeState = NodeState<ConfiguredNodeDefinitionMap['Project']> 
export type BELONGS_TO_Organization_Relationship = {fromNodeId: string}&RelationshipState<ConfiguredNodeDefinitionMap['Project']['relationshipDefinitionMap']['BELONGS_TO']>
export type KanbanNodeState = NodeState<ConfiguredNodeDefinitionMap['Kanban']> 
export type BELONGS_TO_Project_Relationship = {fromNodeId: string}&RelationshipState<ConfiguredNodeDefinitionMap['Kanban']['relationshipDefinitionMap']['BELONGS_TO']>
export type TaskNodeState = NodeState<ConfiguredNodeDefinitionMap['Task']> 
export type BELONGS_TO_Kanban_Relationship = {fromNodeId: string}&RelationshipState<ConfiguredNodeDefinitionMap['Task']['relationshipDefinitionMap']['BELONGS_TO']>
export type CommentNodeState = NodeState<ConfiguredNodeDefinitionMap['Comment']> 
export type BELONGS_TO_Task_Relationship = {fromNodeId: string}&RelationshipState<ConfiguredNodeDefinitionMap['Comment']['relationshipDefinitionMap']['BELONGS_TO']>
export type SENT_BY_User_Relationship = {fromNodeId: string}&RelationshipState<ConfiguredNodeDefinitionMap['Comment']['relationshipDefinitionMap']['SENT_BY']>
