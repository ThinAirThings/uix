import { GenericUixConfig } from "../config/defineConfig";


export const functionModuleTemplate = (config: GenericUixConfig) => {
    return /* ts */`
'use server'
// Start of File
import {nodeTypeMap} from './staticObjects'
import {
    mergeNodeFactory,
} from '@thinairthings/uix'

export const mergeNode = mergeNodeFactory(nodeTypeMap)
`}