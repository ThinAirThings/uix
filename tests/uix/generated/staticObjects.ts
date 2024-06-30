
// Start of File
import uixConfig from '/home/aircraft/create/ThinAir/libs/uix/tests/uix/uix.config'
import { NodeShape} from '@thinairthings/uix'
export type ConfiguredNodeTypeMap = typeof uixConfig.graph.nodeTypeMap
export const rootNodeKey: NodeKey<ConfiguredNodeTypeMap, 'Root'> = {nodeType: 'Root', nodeId: '0'}
export const nodeTypeMap = uixConfig.graph.nodeTypeMap
export type NodeKey<T extends keyof ConfiguredNodeTypeMap> = {
    nodeType: T
    nodeId: string
}
export type RootNode = NodeShape<ConfiguredNodeTypeMap['Root']> 
export type UserNode = NodeShape<ConfiguredNodeTypeMap['User']> 
export type EducationNode = NodeShape<ConfiguredNodeTypeMap['Education']> 
export type ProfileNode = NodeShape<ConfiguredNodeTypeMap['Profile']> 
export type WorkExperienceNode = NodeShape<ConfiguredNodeTypeMap['WorkExperience']> 
export type WorkPreferenceNode = NodeShape<ConfiguredNodeTypeMap['WorkPreference']> 

