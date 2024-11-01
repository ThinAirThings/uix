

import path from "path";
import { GenericUixConfig } from "../config/defineConfig";
import dedent from "dedent";

export const staticObjectsTemplate = (config: GenericUixConfig) => /* ts */`
// Start of File
import uixConfig from '${path.relative(config.outdir, config.pathToConfig).split(path.sep).join('/').replace(/\.[^/.]+$/, '')}'
import { NodeShape, NodeState, GraphDefinition, RelationshipState, RelationshipMerge } from '@thinairthings/uix'

export const uixGraph = new GraphDefinition(uixConfig.type, uixConfig.nodeDefinitionSet)
export const nodeDefinitionMap = uixGraph.nodeDefinitionMap
export type ConfiguredNodeDefinitionMap = typeof nodeDefinitionMap
export type NodeKey<T extends keyof ConfiguredNodeDefinitionMap> = {
    nodeType: T
    nodeId: string
}
${config.graph.nodeDefinitionMap['Root']
            ? `export const rootNodeKey: NodeKey<'Root'> = {nodeType: 'Root', nodeId: '0'}`
            : ``
        }
${Object.keys(config.graph.nodeDefinitionMap).map(nodeType =>
    dedent/*ts*/`export type ${nodeType}Node = NodeShape<ConfiguredNodeDefinitionMap, '${nodeType}'> \n`
        ).join('')}
${Object.keys(config.graph.nodeDefinitionMap).map(nodeType =>
    dedent/*ts*/`
        export type ${nodeType}NodeState = NodeState<ConfiguredNodeDefinitionMap, '${nodeType}'> 
    `).join('\n')
    }
`
