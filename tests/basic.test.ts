import { execSync } from 'child_process'
import { v4 as uuid } from 'uuid'
import { expect, test } from 'vitest'
import { Err, tryCatch, UixErrSubtype } from '../src/types/Result'
import { createNode, deleteNode, getAllOfNodeType, getChildNodeSet, getNodeByIndex, getUniqueChildNode, getVectorNodeByKey, updateNode } from './uix/generated/functionModule'
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
    const { data: userNode, error: createUserNodeError } = await createNode([{ nodeType: 'Root', nodeId: '0' }], 'User', {
        email: `${uuid()}@localTest.com`,
        firstName: 'Local',
        lastName: 'Test',
        userType: 'Unspecified',
        completedOnboardingV2: false,
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
    const { data: createdEducationNode, error: createEducationNodeError } = await createNode(
        [userNode],
        'Education', {
        school: 'RPI',
        graduationYear: 2022,
        description: 'I studied math',
        degree: 'Master of Arts (M.A.)',
        fieldOfStudy: 'Electrical Engineering',
    })
    expect(createdEducationNode).toBeTruthy()
    if (createEducationNodeError) {
        console.error(createEducationNodeError)
        expect(createEducationNodeError).toBeFalsy()
        return
    }
    expect(createdEducationNode).toBeTruthy()
    const { data: createdEducationVectorNode, error: createEducationVectorNodeError } = await getVectorNodeByKey({ nodeType: `${createdEducationNode.nodeType}Vector`, nodeId: createdEducationNode.nodeId })
    if (createEducationVectorNodeError) {
        console.error(createEducationVectorNodeError)
        expect(createEducationVectorNodeError).toBeFalsy()
        return
    }
    expect(createdEducationVectorNode).toBeTruthy()

    // Check updates
    const { data: updatedEducationNode, error: updateEducationNodeError } = await updateNode(createdEducationNode, {
        school: 'RPI',
        description: 'I studied Basket weaving',
        degree: 'Master of Arts (M.A.)',
        fieldOfStudy: 'Electrical Engineering',
    })
    if (updateEducationNodeError) {
        console.error(updateEducationNodeError)
        expect(updateEducationNodeError).toBeFalsy()
        return
    }
    expect(updatedEducationNode).toBeTruthy()

    const { data: updatedEducationVectorNode, error: updateEducationVectorNodeError } = await getVectorNodeByKey({ nodeType: `${updatedEducationNode.nodeType}Vector`, nodeId: updatedEducationNode.nodeId })
    if (updateEducationVectorNodeError) {
        console.error(updateEducationVectorNodeError)
        expect(updateEducationVectorNodeError).toBeFalsy()
        return
    }
    expect(updatedEducationVectorNode).toBeTruthy()
    expect(createdEducationVectorNode.description![0]).not.toEqual(updatedEducationVectorNode.description![0])

    // Check getAllNodeType
    const { data: allEducationNodes, error: getAllEducationNodesError } = await getAllOfNodeType('Education', {
        limit: 4
    })
    if (getAllEducationNodesError) {
        console.error(getAllEducationNodesError)
        expect(getAllEducationNodesError).toBeFalsy()
        return
    }

    expect(allEducationNodes).toBeTruthy()
    expect(allEducationNodes.length).toBe(4)

    // Check getChildNodeSEt
    const { data: childEducationNodes, error: getChildEducationNodesError } = await getChildNodeSet(userNode, 'Education')
    if (getChildEducationNodesError) {
        console.error(getChildEducationNodesError)
        expect(getChildEducationNodesError).toBeFalsy()
        return
    }
    expect(childEducationNodes).toBeTruthy()
    expect(childEducationNodes.length).toBeGreaterThan(0)
    // childEducationNodes[0] // Type test
    // Check getUniqueChildNode
    const { data: workPreferenceNode, error: getUniqueProfileNodeError } = await getUniqueChildNode(userNode, 'Profile')
    if (getUniqueProfileNodeError) {
        console.error(getUniqueProfileNodeError)
        expect(getUniqueProfileNodeError).toBeFalsy()
        return
    }
    expect(workPreferenceNode).toBeTruthy()

    // Check getNodeByIndex
    const { data: userNodeByIndex, error: getUserNodeByIndexError } = await getNodeByIndex('User', 'email', userNode.email)
    if (getUserNodeByIndexError) {
        console.error(getUserNodeByIndexError)
        expect(getUserNodeByIndexError).toBeFalsy()
        return
    }
    expect(userNodeByIndex).toBeTruthy()
    writeFileSync(path.resolve('tests', 'userNode.json'), JSON.stringify(userNodeByIndex, null, 2))
    await new Promise(res => setTimeout(res, 1000 * 40))
    // Check deleteNode
    const { data: deleted, error: deleteError } = await deleteNode(userNodeByIndex)
    if (deleteError) {
        console.error(deleteError)
        expect(deleteError).toBeFalsy()
        return
    }
    expect(deleted).toBeTruthy()

    const finalNodeCount = await getTotalNodeCount()
    expect(finalNodeCount).toBe(initialnodeCount)
})