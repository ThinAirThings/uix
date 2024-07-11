import { execSync } from 'child_process'
import { v4 as uuid } from 'uuid'
import { expect, test } from 'vitest'
import { Err, tryCatch, UixErrSubtype } from '../src/types/Result'
import { createNode, deleteNode, getAllOfNodeType, getChildNodeSet, getNodeByIndex, getNodeByKey, getUniqueChildNode, getVectorNodeByKey, updateNode } from './uix/generated/functionModule'
import { useUniqueChild } from './uix/generated/useUniqueChild'
import { EagerResult, Integer } from 'neo4j-driver'
import { getTotalNodeCount } from './utils/getTotalNodeCount'
import { writeFileSync } from 'fs'
import path from 'path'
test('Integration test', async () => {
    const { data: uixData, error: uixError } = await tryCatch({
        try: () => execSync('pnpm uix'),
        catch: (e: Error) => Err({
            type: 'TestErr',
            subtype: 'UixError',
            message: e.message,
            data: { e }
        })
    })
    const initialnodeCount = await getTotalNodeCount()

    // Create Node
    const { data: userNode, error: createUserNodeError } = await createNode({
        parentNodeKeys: [{ nodeType: 'Root', nodeId: '0' }],
        childNodeType: 'User',
        initialState: {
            email: `${uuid()}@localTest.com`,
            firstName: 'Local',
            lastName: 'Test',
            userType: 'Unspecified',
            completedOnboardingV2: false,
        }
    })
    if (createUserNodeError) {
        console.error(createUserNodeError.data)
        if (createUserNodeError.subtype === UixErrSubtype.CREATE_NODE_FAILED) {
            console.error(createUserNodeError.data)
        }
        expect(createUserNodeError).toBeFalsy()
        return
    }
    expect(userNode).toBeTruthy()
    writeFileSync(path.join(process.cwd(), 'tests', 'userNode.json'), JSON.stringify(userNode, null, 2))
    const { data: createdEducationNode, error: createEducationNodeError } = await createNode({
        parentNodeKeys: [userNode],
        childNodeType: 'Education',
        initialState: {
            school: 'RPI',
            description: 'I studied math',
            degree: 'Master of Arts (M.A.)',
            fieldOfStudy: 'Electrical Engineering',
        }
    })
    expect(createdEducationNode).toBeTruthy()
    if (createEducationNodeError) {
        console.error(createEducationNodeError)
        expect(createEducationNodeError).toBeFalsy()
        return
    }
    expect(createdEducationNode).toBeTruthy()
    const { data: createdEducationVectorNode, error: createEducationVectorNodeError } = await getVectorNodeByKey({
        nodeKey: { nodeType: `${createdEducationNode.nodeType}Vector`, nodeId: createdEducationNode.nodeId }
    })
    if (createEducationVectorNodeError) {
        console.error(createEducationVectorNodeError)
        expect(createEducationVectorNodeError).toBeFalsy()
        return
    }
    expect(createdEducationVectorNode).toBeTruthy()

    // Check updates
    const { data: updatedEducationNode, error: updateEducationNodeError } = await updateNode({
        nodeKey: createdEducationNode,
        inputState: {
            school: 'RPI',
            description: 'I studied Basket weaving',
            degree: 'Master of Arts (M.A.)',
            fieldOfStudy: 'Electrical Engineering',
        }
    })
    if (updateEducationNodeError) {
        console.error(updateEducationNodeError)
        expect(updateEducationNodeError).toBeFalsy()
        return
    }
    expect(updatedEducationNode).toBeTruthy()

    const { data: updatedEducationVectorNode, error: updateEducationVectorNodeError } = await getVectorNodeByKey({
        nodeKey: { nodeType: `${updatedEducationNode.nodeType}Vector`, nodeId: updatedEducationNode.nodeId }
    })
    if (updateEducationVectorNodeError) {
        console.error(updateEducationVectorNodeError)
        expect(updateEducationVectorNodeError).toBeFalsy()
        return
    }
    createEducationVectorNodeError
    expect(updatedEducationVectorNode).toBeTruthy()
    expect(createdEducationVectorNode.description![0]).not.toEqual(updatedEducationVectorNode.description![0])

    // Check getAllNodeType
    const { data: allEducationNodes, error: getAllEducationNodesError } = await getAllOfNodeType({
        nodeType: 'Education',
        options: {
            limit: 4
        }
    })
    if (getAllEducationNodesError) {
        console.error(getAllEducationNodesError)
        expect(getAllEducationNodesError).toBeFalsy()
        return
    }

    expect(allEducationNodes).toBeTruthy()

    // Check getChildNodeSEt
    const { data: childEducationNodes, error: getChildEducationNodesError } = await getChildNodeSet({
        parentNodeKey: userNode,
        childNodeType: 'Education'
    })
    if (getChildEducationNodesError) {
        console.error(getChildEducationNodesError)
        expect(getChildEducationNodesError).toBeFalsy()
        return
    }

    expect(childEducationNodes).toBeTruthy()
    expect(childEducationNodes.length).toBeGreaterThan(0)
    // childEducationNodes[0] // Type test
    // Check getUniqueChildNode
    const { data: workPreferenceNode, error: getUniqueProfileNodeError } = await getUniqueChildNode({
        parentNodeKey: userNode,
        childNodeType: 'WorkPreference'
    })
    if (getUniqueProfileNodeError) {
        console.error(getUniqueProfileNodeError)
        expect(getUniqueProfileNodeError).toBeFalsy()
        return
    }
    expect(workPreferenceNode).toBeTruthy()
    // Check getNodeByIndex
    const { data: userNodeByIndex, error: getUserNodeByIndexError } = await getNodeByIndex({
        nodeType: 'User',
        indexKey: 'email',
        indexValue: userNode.email
    })
    if (getUserNodeByIndexError) {
        console.error(getUserNodeByIndexError)
        expect(getUserNodeByIndexError).toBeFalsy()
        return
    }
    expect(userNodeByIndex).toBeTruthy()
    writeFileSync(path.resolve('tests', 'userNode.json'), JSON.stringify(userNodeByIndex, null, 2))
    // Check deleteNode
    const { data: deleted, error: deleteError } = await deleteNode({
        nodeKey: userNodeByIndex
    })
    if (deleteError) {
        console.error(deleteError)
        expect(deleteError).toBeFalsy()
        return
    }
    expect(deleted).toBeTruthy()

    const finalNodeCount = await getTotalNodeCount()
    expect(finalNodeCount).toBe(initialnodeCount)
})