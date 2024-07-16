import { defineConfig } from '@thinairthings/uix'
import { UserNodeDefinition } from './NodeDefinitions/UserNodeDefinition'
import { OrganizationNodeDefinition } from './NodeDefinitions/OrganizationNodeDefinition'


export default defineConfig({
    type: 'Base',
    nodeDefinitionSet: [
        UserNodeDefinition,
        OrganizationNodeDefinition
    ],
    outdir: 'tests/uix/generated',
    envPath: '.env.test',
})