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
    const { data: userNode, error: createUserNodeError } = await createNode([rootNodeKey], 'User', userNodeData)
    if (!userNode) throwTestError(createUserNodeError)
    const { data: profileNode, error: getProfileNodeError } = await getUniqueChildNode(userNode, 'Profile')
    if (!profileNode) throwTestError(getProfileNodeError)
    await updateNode(profileNode, profileNodeData)
    const { data: workPreferencesNode, error: createWorkPreferencesNodeError } = await getUniqueChildNode(userNode, 'WorkPreference')
    if (!workPreferencesNode) throwTestError(createWorkPreferencesNodeError)
    await updateNode(workPreferencesNode, workPreferenceNodeData)
    const createdEducationNodeResult = await Promise.all(educationNodeSetData.map(async (educationNodeData) => await createNode([userNode], 'Education', educationNodeData)))
    createdEducationNodeResult.forEach(({ data: createdEducationNode, error: createEducationNodeError }) => {
        if (!createdEducationNode) throwTestError(createEducationNodeError)
    })
    const createdWorkExperienceNodeResult = await Promise.all(workExperienceNodeSetData.map(async (workExperienceNodeData) => await createNode([userNode], 'WorkExperience', workExperienceNodeData)))
    createdWorkExperienceNodeResult.forEach(({ data: createdWorkExperienceNode, error: createWorkExperienceNodeError }) => {
        if (!createdWorkExperienceNode) throwTestError(createWorkExperienceNodeError)
    })
    return userNode
}