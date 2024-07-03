import { GenericUixConfig } from "../config/defineConfig";
import path from 'path'


export const functionModuleTemplate = (config: GenericUixConfig) => {
    return /* ts */`
'use server'
// Start of File
import {nodeTypeMap} from './staticObjects'
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
import {driver} from './clients'

const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!
})

export const createNode = createNodeFactory(driver, openaiClient, nodeTypeMap)
export const updateNode = updateNodeFactory(driver, openaiClient, nodeTypeMap)
export const deleteNode = deleteNodeFactory(driver, nodeTypeMap)
export const getNodeByKey = getNodeByKeyFactory(driver, nodeTypeMap)
export const getVectorNodeByKey = getVectorNodeByKeyFactory(driver, nodeTypeMap)
export const getAllOfNodeType = getAllOfNodeTypeFactory(driver, nodeTypeMap)
export const getChildNodeSet = getChildNodeSetFactory(driver, nodeTypeMap)
export const getUniqueChildNode = getUniqueChildNodeFactory(driver, nodeTypeMap)
export const getNodeByIndex = getNodeByIndexFactory(driver, nodeTypeMap)

`}