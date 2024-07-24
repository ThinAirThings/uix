
'use server'
// Start of File
import {nodeTypeMap} from './staticObjects'
import {
    mergeNodeFactory,
    deleteNodeFactory,
    collectNodeFactory,
    collectNodeFactoryv2
} from '@thinairthings/uix'

export const mergeNode = mergeNodeFactory(nodeTypeMap)
export const deleteNode = deleteNodeFactory(nodeTypeMap)
export const collectNode = collectNodeFactory(nodeTypeMap)
export const collectNodev2 = collectNodeFactoryv2(nodeTypeMap)
