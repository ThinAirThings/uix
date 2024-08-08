import { defineConfig } from '@thinairthings/uix'
import { UserNodeDefinition } from './NodeDefinitions/UserNodeDefinition'
import { OrganizationNodeDefinition } from './NodeDefinitions/OrganizationNodeDefinition'
import { MessageNodeDefinition } from './NodeDefinitions/MessageNodeDefinition'
import { ChatNodeDefinition } from './NodeDefinitions/ChatNodeDefinition'
import { ProjectNodeDefinition } from './NodeDefinitions/ProjectNodeDefinition'
import {KanbanNodeDefinition} from './NodeDefinitions/KanbanNodeDefinition'
import {TaskNodeDefinition} from './NodeDefinitions/TaskNodeDefinition'
import {CommentNodeDefinition} from './NodeDefinitions/CommentNodeDefinition'
export default defineConfig({
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