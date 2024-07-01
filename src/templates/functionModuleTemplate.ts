import { GenericUixConfig } from "../config/defineConfig";
import path from 'path'


export const functionModuleTemplate = (config: GenericUixConfig) => {
    return /* ts */`
'use server'
// Start of File
import uixConfig from '${path.relative(config.outdir, config.pathToConfig).split(path.sep).join('/')}'
import {
    createNodeFactory, 
    updateNodeFactory, 
    deleteNodeFactory, 
    getNodeByKeyFactory, 
    getVectorNodeByKeyFactory,
    getAllOfNodeTypeFactory,
    getChildNodeSetFactory,
    getUniqueChildNodeFactory,
    getNodeByIndexFactory,
} from '@thinairthings/uix'
import OpenAI from 'openai'
import {driver} from './staticObjects.ts'

const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!
})

export const createNode = createNodeFactory(driver, openaiClient, uixConfig.graph.nodeTypeMap)
export const updateNode = updateNodeFactory(driver, openaiClient, uixConfig.graph.nodeTypeMap)
export const deleteNode = deleteNodeFactory(driver, uixConfig.graph.nodeTypeMap)
export const getNodeByKey = getNodeByKeyFactory(driver, uixConfig.graph.nodeTypeMap)
export const getVectorNodeByKey = getVectorNodeByKeyFactory(driver, uixConfig.graph.nodeTypeMap)
export const getAllOfNodeType = getAllOfNodeTypeFactory(driver, uixConfig.graph.nodeTypeMap)
export const getChildNodeSet = getChildNodeSetFactory(driver, uixConfig.graph.nodeTypeMap)
export const getUniqueChildNode = getUniqueChildNodeFactory(driver, uixConfig.graph.nodeTypeMap)
export const getNodeByIndex = getNodeByIndexFactory(driver, uixConfig.graph.nodeTypeMap)

`}