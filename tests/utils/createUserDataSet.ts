import { createNode, getUniqueChildNode, updateNode } from "../uix/generated/functionModule"
import { EducationNodeState, ProfileNodeState, rootNodeKey, UserNodeState, WorkExperienceNodeState, WorkPreferenceNodeState } from "../uix/generated/staticObjects"
import { throwTestError } from "./throwTestError"



export const createUserDataSet = async ({
    userNodeData,
    profileNodeData,
    educationNodeSetData,
    workExperienceNodeSetData,
    workPreferenceNodeData
}: {
    userNodeData: UserNodeState,
    profileNodeData: ProfileNodeState,
    educationNodeSetData: EducationNodeState[],
    workExperienceNodeSetData: WorkExperienceNodeState[],
    workPreferenceNodeData: WorkPreferenceNodeState
}) => {
    const { data: userNode, error: createUserNodeError } = await createNode({
        parentNodeKeys: [rootNodeKey],
        childNodeType: 'User',
        initialState: userNodeData
    })
    if (!userNode) throwTestError(createUserNodeError)
    const { data: profileNode, error: getProfileNodeError } = await getUniqueChildNode({
        parentNodeKey: userNode,
        childNodeType: 'Profile'
    })
    if (!profileNode) throwTestError(getProfileNodeError)
    await updateNode({
        nodeKey: profileNode,
        inputState: profileNodeData
    })
    const { data: workPreferencesNode, error: createWorkPreferencesNodeError } = await getUniqueChildNode({
        parentNodeKey: userNode,
        childNodeType: 'WorkPreference'
    })
    if (!workPreferencesNode) throwTestError(createWorkPreferencesNodeError)
    await updateNode({
        nodeKey: workPreferencesNode,
        inputState: workPreferenceNodeData
    })
    const createdEducationNodeResult = await Promise.all(educationNodeSetData.map(async (educationNodeData) => await createNode({
        parentNodeKeys: [userNode],
        childNodeType: 'Education',
        initialState: educationNodeData
    })))
    createdEducationNodeResult.forEach(({ data: createdEducationNode, error: createEducationNodeError }) => {
        if (!createdEducationNode) throwTestError(createEducationNodeError)
    })
    const createdWorkExperienceNodeResult = await Promise.all(workExperienceNodeSetData.map(async (workExperienceNodeData) => await createNode({
        parentNodeKeys: [userNode],
        childNodeType: 'WorkExperience',
        initialState: workExperienceNodeData
    })))
    createdWorkExperienceNodeResult.forEach(({ data: createdWorkExperienceNode, error: createWorkExperienceNodeError }) => {
        if (!createdWorkExperienceNode) throwTestError(createWorkExperienceNodeError)
    })
    return userNode
}