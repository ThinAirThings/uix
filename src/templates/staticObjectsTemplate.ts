

import { GenericUixConfig } from "../config/defineConfig";

export const staticObjectsTemplate = (config: GenericUixConfig) => {
    return /* ts */`
// Start of File
import uixConfig from '${config.pathToConfig.replace('uix.config.ts', 'uix.config')}'
import { NodeShape } from '@thinairthings/uix'
import neo4j from 'neo4j-driver'
export type ConfiguredNodeTypeMap = typeof uixConfig.graph.nodeTypeMap

export const nodeTypeMap = uixConfig.graph.nodeTypeMap
export type NodeKey<T extends keyof ConfiguredNodeTypeMap> = {
    nodeType: T
    nodeId: string
}
${config.graph.nodeTypeMap['Root']
            ? `export const rootNodeKey: NodeKey<'Root'> = {nodeType: 'Root', nodeId: '0'}`
            : ``
        }
${Object.keys(config.graph.nodeTypeMap).map(nodeType =>
    /*ts*/`export type ${nodeType}Node = NodeShape<ConfiguredNodeTypeMap['${nodeType}']> \n`
        ).join('')}

export const driver = neo4j.driver(
    process.env.NEO4J_URI!, 
    neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!)
)
`}

