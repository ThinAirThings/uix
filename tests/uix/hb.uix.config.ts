import { defineConfig } from '@thinairthings/uix'
import { UserNodeDefinition } from './hb.NodeDefinitions/UserNodeDefinition'
import { CompanyNodeDefinition } from './hb.NodeDefinitions/CompanyNodeDefinition'
import { JobNodeDefinition } from './hb.NodeDefinitions/JobNodeDefinition'


export const uixConfig =  defineConfig({
    type: 'Base',
    nodeDefinitionSet: [
        UserNodeDefinition,
        CompanyNodeDefinition,
        JobNodeDefinition
    ],
    outdir: 'tests/uix/generated',
    envPath: '.env.test',
})

export default uixConfig