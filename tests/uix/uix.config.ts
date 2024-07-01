import { defineConfig } from '@thinairthings/uix'
import { UserNodeType } from './nodeTypes/UserNodeType'
import { EducationNodeType } from './nodeTypes/EducationNodeType'
import { ProfileNodeType } from './nodeTypes/ProfileNodeType'
import { WorkExperienceNodeType } from './nodeTypes/WorkExperienceNodeType'
import { WorkPreferenceNodeType } from './nodeTypes/WorkPreferenceNodeType'
import { RootNodeType } from './nodeTypes/RootNodeType'

export default defineConfig({
    type: 'Base',
    nodeTypeSet: [
        RootNodeType,
        UserNodeType,
        EducationNodeType,
        ProfileNodeType,
        WorkExperienceNodeType,
        WorkPreferenceNodeType
    ],
    outdir: 'tests/uix/generated',
    envPath: '.env.test',
})