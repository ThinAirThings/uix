

import path from "path";
import { GenericUixConfig } from "../config/defineConfig";

export const staticObjectsTemplate = (config: GenericUixConfig) => {
    return /* ts */`
// Start of File
import uixConfig from '${path.relative(config.outdir, config.pathToConfig).split(path.sep).join('/').replace(/\.[^/.]+$/, '')}'
import { NodeShape, NodeState, createNeo4jClient, GraphType } from '@thinairthings/uix'

export const uixGraph = new GraphType(uixConfig.type, uixConfig.nodeTypeSet)
export const nodeTypeMap = uixGraph.nodeTypeMap
export type ConfiguredNodeTypeMap = typeof nodeTypeMap
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
${Object.keys(config.graph.nodeTypeMap).map(nodeType =>
    /*ts*/`export type ${nodeType}NodeState = NodeState<ConfiguredNodeTypeMap['${nodeType}']> \n`
        ).join('')
        }
`}

