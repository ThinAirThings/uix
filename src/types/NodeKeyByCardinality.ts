import { AnyNodeDefinitionMap } from "../definitions/NodeDefinition";
import { RelationshipDefinition, StrengthTypeSet } from "../definitions/RelationshipDefinition";
import { NodeKey } from "./NodeKey";

export type NodeKeyByCardinality<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    NodeType extends keyof NodeDefinitionMap,
    Strength extends StrengthTypeSet,
    RelationshipType extends (NodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number] & { strength: Strength })['type'],
    RelationshipDirection extends 'to' | 'from'
> = ((NodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number] & { strength: Strength }) & { type: RelationshipType }) extends RelationshipDefinition<
    infer FromNodeDefinition,
    any,
    infer Cardinality,
    any,
    infer ToNodeDefinition,
    any
>
    ? Cardinality extends 'one-to-one' | 'many-to-one'
    ? NodeKey<NodeDefinitionMap, RelationshipDirection extends 'to' ? ToNodeDefinition['type'] : FromNodeDefinition['type']>
    : NodeKey<NodeDefinitionMap, RelationshipDirection extends 'to' ? ToNodeDefinition['type'] : FromNodeDefinition['type']>[]
    : never

// ((NodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number] & { strength: Strength }) & { type: RelationshipType })['cardinality'] extends ('one-to-one' | 'many-to-one')
//     ? NodeKey<NodeDefinitionMap, ((NodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number] & { strength: Strength }) & { type: RelationshipType })[`${RelationshipDirection}NodeDefinition`]['type']>
//     : NodeKey<NodeDefinitionMap, ((NodeDefinitionMap[NodeType]['relationshipDefinitionSet'][number] & { strength: Strength }) & { type: RelationshipType })[`${RelationshipDirection}NodeDefinition`]['type']>[]