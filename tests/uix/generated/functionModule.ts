
'use server'
// Start of File
import {nodeDefinitionMap} from './staticObjects'
import {
    mergeSubgraphFactory,
    mergeSubgraphFactoryv2,
    mergeSubgraphFactoryv3,
    deleteNodeFactory,
    extractSubgraphFactory,
} from '@thinairthings/uix'

export const mergeSubgraph = mergeSubgraphFactory(nodeDefinitionMap)
export const mergeSubgraphv2 = mergeSubgraphFactoryv2(nodeDefinitionMap)
export const mergeSubgraphv3 = mergeSubgraphFactoryv3(nodeDefinitionMap)
export const deleteNode = deleteNodeFactory(nodeDefinitionMap)
export const extractSubgraph = extractSubgraphFactory(nodeDefinitionMap)
