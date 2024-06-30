import { defineConfig } from '@thinairthings/uix'
import { NEO4J_PASSWORD_LOCAL, NEO4J_URI_LOCAL, NEO4J_USERNAME_LOCAL, OPENAI_API_KEY } from './env'
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
    ]
    ,
    outdir: 'tests/uix/generated',
    neo4jConfig: {
        uri: NEO4J_URI_LOCAL,
        username: NEO4J_USERNAME_LOCAL,
        password: NEO4J_PASSWORD_LOCAL
    },
    openaiConfig: {
        apiKey: OPENAI_API_KEY
    }
})