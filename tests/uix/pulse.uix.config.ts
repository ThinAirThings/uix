import { defineConfig } from '@thinairthings/uix'
import { UserNodeDefinition } from './hb.NodeDefinitions/UserNodeDefinition'
import { OrganizationNodeDefinition } from './pulse.NodeDefinitions/OrganizationNodeDefinition'
import { MessageNodeDefinition } from './pulse.NodeDefinitions/MessageNodeDefinition'
import { ChatNodeDefinition } from './pulse.NodeDefinitions/ChatNodeDefinition'
import { ProjectNodeDefinition } from './pulse.NodeDefinitions/ProjectNodeDefinition'
import {KanbanNodeDefinition} from './pulse.NodeDefinitions/KanbanNodeDefinition'
import {TaskNodeDefinition} from './pulse.NodeDefinitions/TaskNodeDefinition'
import {CommentNodeDefinition} from './pulse.NodeDefinitions/CommentNodeDefinition'




export const uixConfig =  defineConfig({
    type: 'Base',
    nodeDefinitionSet: [
        UserNodeDefinition,
        OrganizationNodeDefinition,
        ChatNodeDefinition,
        MessageNodeDefinition,
        ProjectNodeDefinition,
        KanbanNodeDefinition,
        TaskNodeDefinition,
        CommentNodeDefinition
        // PaymentTierDefinition
    ],
    outdir: 'tests/uix/generated',
    envPath: '.env.test',
})

export default uixConfig