
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
import {driver, openaiClient} from './clients'

export const createNode = createNodeFactory(driver, openaiClient, nodeTypeMap)
export const updateNode = updateNodeFactory(driver, openaiClient, nodeTypeMap)
export const deleteNode = deleteNodeFactory(driver, nodeTypeMap)
export const getNodeByKey = getNodeByKeyFactory(driver, nodeTypeMap)
export const getVectorNodeByKey = getVectorNodeByKeyFactory(driver, nodeTypeMap)
export const getAllOfNodeType = getAllOfNodeTypeFactory(driver, nodeTypeMap)
export const getChildNodeSet = getChildNodeSetFactory(driver, nodeTypeMap)
export const getUniqueChildNode = getUniqueChildNodeFactory(driver, nodeTypeMap)
export const getNodeByIndex = getNodeByIndexFactory(driver, nodeTypeMap)

