import { defineConfig } from '@thinairthings/uix'
import { UserNodeDefinition } from './hb.NodeDefinitions/UserNodeDefinition'
import { CompanyNodeDefinition } from './hb.NodeDefinitions/CompanyNodeDefinition'
import { JobNodeDefinition } from './hb.NodeDefinitions/JobNodeDefinition'
import { MessageNodeDefinition } from './hb.NodeDefinitions/MessageNodeDefinition'
import { ProjectNodeDefinition } from './hb.NodeDefinitions/ProjectNodeDefinition'

export const uixConfig =  defineConfig({
    type: 'Base',
    nodeDefinitionSet: [
        UserNodeDefinition,
        CompanyNodeDefinition,
        JobNodeDefinition,
        MessageNodeDefinition,
        ProjectNodeDefinition
    ],
    outdir: 'tests/uix/generated',
    envPath: '.env.test',
})

export default uixConfig