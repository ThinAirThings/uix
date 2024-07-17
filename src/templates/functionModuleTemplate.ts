import { GenericUixConfig } from "../config/defineConfig";


export const functionModuleTemplate = (config: GenericUixConfig) => {
    return /* ts */`
'use server'
// Start of File
import {nodeTypeMap} from './staticObjects'
import {
    mergeNodeFactory,
    deleteNodeFactory,
    collectNodeFactory
} from '@thinairthings/uix'

export const mergeNode = mergeNodeFactory(nodeTypeMap)
export const deleteNode = deleteNodeFactory(nodeTypeMap)
export const collectNode = collectNodeFactory(nodeTypeMap)
`}