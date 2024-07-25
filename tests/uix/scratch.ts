import {RelativeRelationshipMap} from '@thinairthings/uix'
import {nodeDefinitionMap} from './generated/staticObjects'

type Thing = (RelativeRelationshipMap<typeof nodeDefinitionMap, 'User', 'strong'>)
type Organization = (RelativeRelationshipMap<typeof nodeDefinitionMap, 'Organization', 'weak'>)
type Strong = RelativeRelationshipMap<typeof nodeDefinitionMap, 'User', 'strong'>
type Thing3 = typeof nodeDefinitionMap['User']['relationshipDefinitionSet'][number] & { strength: 'strong' }
type Thing2 = Required<Thing>['']['to'][number]['nodeType']
type OrganizationIndex = Organization['']