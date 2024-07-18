import { defineConfig } from '@thinairthings/uix'
import { UserNodeDefinition } from './NodeDefinitions/UserNodeDefinition'
import { OrganizationNodeDefinition } from './NodeDefinitions/OrganizationNodeDefinition'
import { MessageNodeDefinition } from './NodeDefinitions/MessageNodeDefinition'
import { ChatNodeDefinition } from './NodeDefinitions/ChatNodeDefinition'
import { ProjectNodeDefinition } from './NodeDefinitions/ProjectNodeDefinition'
export default defineConfig({
    type: 'Base',
    nodeDefinitionSet: [
        UserNodeDefinition,
        OrganizationNodeDefinition,
        ChatNodeDefinition,
        MessageNodeDefinition,
        ProjectNodeDefinition
    ],
    outdir: 'tests/uix/generated',
    envPath: '.env.test',
})