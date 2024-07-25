
'use server'
// Start of File
import {nodeDefinitionMap} from './staticObjects'
import {
    mergeNodeFactory,
    deleteNodeFactory,
    extractSubgraphFactory,
} from '@thinairthings/uix'

export const mergeNode = mergeNodeFactory(nodeDefinitionMap)
export const deleteNode = deleteNodeFactory(nodeDefinitionMap)
export const extractSubgraph = extractSubgraphFactory(nodeDefinitionMap)
