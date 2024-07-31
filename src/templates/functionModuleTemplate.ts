import { GenericUixConfig } from "../config/defineConfig";


export const functionModuleTemplate = (config: GenericUixConfig) => {
    return /* ts */`
'use server'
// Start of File
import {nodeDefinitionMap} from './staticObjects'
import {
    mergeSubgraphFactory,
    extractSubgraphFactory,
} from '@thinairthings/uix'

export const mergeSubgraph = mergeSubgraphFactory(nodeDefinitionMap)
export const extractSubgraph = extractSubgraphFactory(nodeDefinitionMap)
`}