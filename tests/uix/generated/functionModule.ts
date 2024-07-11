
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

export const createNode = createNodeFactory(nodeTypeMap)
export const updateNode = updateNodeFactory(nodeTypeMap)
export const deleteNode = deleteNodeFactory(nodeTypeMap)
export const getNodeByKey = getNodeByKeyFactory(nodeTypeMap)
export const getVectorNodeByKey = getVectorNodeByKeyFactory(nodeTypeMap)
export const getAllOfNodeType = getAllOfNodeTypeFactory(nodeTypeMap)
export const getChildNodeSet = getChildNodeSetFactory(nodeTypeMap)
export const getUniqueChildNode = getUniqueChildNodeFactory(nodeTypeMap)
export const getNodeByIndex = getNodeByIndexFactory(nodeTypeMap)

