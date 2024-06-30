import { execSync } from 'child_process'
import { v4 as uuid } from 'uuid'
import { expect, test } from 'vitest'
import { AnyErrType, Err, tryCatch, UixErr, UixErrSubtype } from '../src/types/Result'
import { createNode, deleteNode, getAllOfNodeType, getChildNodeSet, getNodeByIndex, getUniqueChildNode, getVectorNodeByKey, updateNode } from './uix/generated/functionModule'
import { throwTestError } from './utils/throwTestError'
import { getTotalNodeCount } from './utils/getTotalNodeCount'

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
    // Create User node
    const { data: userNode, error: createUserNodeError } = await createNode([{ nodeType: 'Root', nodeId: '0' }], 'User', {
        email: `${uuid()}@localTest.com`,
        firstName: 'Local',
        lastName: 'Test',
        userType: 'Unspecified',
        completedOnboardingV2: false,
    })
    if (createUserNodeError) throwTestError(createUserNodeError)
    // Create Profile node
    const { data: createdEducationNode, error: createEducationNodeError } = await createNode(
        [userNode],
        'Education', {
        school: '',
        graduationYear: 2020,
        description: 'I studied various aspects of marketing including market research, consumer behavior, and digital marketing strategies.',
        degree: 'Associate of Applied Science (A.A.S.)',
        fieldOfStudy: 'Biology',
    });
    if (createEducationNodeError) throwTestError(createEducationNodeError)
    // Create WorkExperience node
    const { data: createdWorkExperienceNode, error: createWorkExperienceNodeError } = await createNode(
        [userNode],
        'WorkExperience', {
        companyName: 'Retail Chain Inc.',
        title: 'Marketing Specialist',
        startDate: '2021-05-01',
        description: 'I develop and implement marketing campaigns, manage social media channels, and analyze market trends to boost sales and customer engagement.',
    });
    if (createWorkExperienceNodeError) throwTestError(createWorkExperienceNodeError)
    // Create Profile node
    const { data: profileNode, error: createProfileNodeError } = await getUniqueChildNode(userNode, 'Profile')
    if (createProfileNodeError) throwTestError(createProfileNodeError)
    // Cleanup
    await deleteNode(userNode)
    const finalNodeCount = await getTotalNodeCount()
    expect(finalNodeCount).toBe(initialnodeCount)
})