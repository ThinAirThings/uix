
'use server'
// Start of File
import {nodeDefinitionMap} from './staticObjects'
import {
    mergeSubgraphFactory,
    deleteNodeFactory,
    extractSubgraphFactory,
    extractSubgraphFactoryv2,
} from '@thinairthings/uix'

export const mergeSubgraph = mergeSubgraphFactory(nodeDefinitionMap)
export const deleteNode = deleteNodeFactory(nodeDefinitionMap)
export const extractSubgraph = extractSubgraphFactory(nodeDefinitionMap)
export const extractSubgraphv2 = extractSubgraphFactoryv2(nodeDefinitionMap)
