
// Start of File
import uixConfig from '/home/aircraft/create/ThinAir/libs/uix/tests/uix/uix.config'
import { NodeShape } from '@thinairthings/uix'
import neo4j from 'neo4j-driver'
export type ConfiguredNodeTypeMap = typeof uixConfig.graph.nodeTypeMap

export const nodeTypeMap = uixConfig.graph.nodeTypeMap
export type NodeKey<T extends keyof ConfiguredNodeTypeMap> = {
    nodeType: T
    nodeId: string
}
export const rootNodeKey: NodeKey<'Root'> = {nodeType: 'Root', nodeId: '0'}
export type RootNode = NodeShape<ConfiguredNodeTypeMap['Root']> 
export type UserNode = NodeShape<ConfiguredNodeTypeMap['User']> 
export type EducationNode = NodeShape<ConfiguredNodeTypeMap['Education']> 
export type ProfileNode = NodeShape<ConfiguredNodeTypeMap['Profile']> 
export type WorkExperienceNode = NodeShape<ConfiguredNodeTypeMap['WorkExperience']> 
export type WorkPreferenceNode = NodeShape<ConfiguredNodeTypeMap['WorkPreference']> 


export const driver = neo4j.driver(
    process.env.NEO4J_URI!, 
    neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!)
)
