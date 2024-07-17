import {RelativeRelationshipMap} from '@thinairthings/uix'
import {nodeTypeMap} from './generated/staticObjects'

type Thing = (RelativeRelationshipMap<typeof nodeTypeMap, 'User', 'strong'>)
type Organization = (RelativeRelationshipMap<typeof nodeTypeMap, 'Organization', 'weak'>)
type Strong = RelativeRelationshipMap<typeof nodeTypeMap, 'User', 'strong'>
type Thing3 = typeof nodeTypeMap['User']['relationshipDefinitionSet'][number] & { strength: 'strong' }
type Thing2 = Required<Thing>['']['to'][number]['nodeType']
type OrganizationIndex = Organization['']