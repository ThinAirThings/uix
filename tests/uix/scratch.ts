import {AnyNodeDefinitionMap, defineConfig, GraphDefinition, mergeSubgraphFactory, useUixFactory} from '@thinairthings/uix'
import {nodeDefinitionMap} from './generated/staticObjects'
import { UserNodeDefinition } from './NodeDefinitions/UserNodeDefinition'
import { OrganizationNodeDefinition } from './NodeDefinitions/OrganizationNodeDefinition'
import { ChatNodeDefinition } from './NodeDefinitions/ChatNodeDefinition'
import { MessageNodeDefinition } from './NodeDefinitions/MessageNodeDefinition'
import { ProjectNodeDefinition } from './NodeDefinitions/ProjectNodeDefinition'
import { KanbanNodeDefinition } from './NodeDefinitions/KanbanNodeDefinition'
import { TaskNodeDefinition } from './NodeDefinitions/TaskNodeDefinition'
import { CommentNodeDefinition } from './NodeDefinitions/CommentNodeDefinition'
import {useUix} from './uix.config'



// const useUix = useUixFactory(new GraphDefinition('Main', defineConfig({
//     type: 'Base',
//     nodeDefinitionSet: [
//         UserNodeDefinition,
//         OrganizationNodeDefinition,
//         ChatNodeDefinition,
//         MessageNodeDefinition,
//         ProjectNodeDefinition,
//         KanbanNodeDefinition,
//         TaskNodeDefinition,
//         CommentNodeDefinition
//         // PaymentTierDefinition
//     ],
//     outdir: 'tests/uix/generated',
//     envPath: '.env.test',
// }).nodeDefinitionSet).nodeDefinitionMap)

// const {data} = useUix({
//     rootNodeIndex: {
//         nodeType: 'User',
//         email: ''
//     },
//     defineSubgraph: (subgraph) => subgraph.extendPath('User', '-ACCESS_TO->Organization')
// })