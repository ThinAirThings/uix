/**
 * @fileoverview Defines the NodeDefinition class and related types for defining node types in a graph database.
 * @module NodeDefinition
 */

import { TypeOf, ZodObject, ZodOptional, ZodTypeAny, z, ZodString, ZodRawShape, ZodLiteral, AnyZodObject, ZodDefault, ZodType, ZodDiscriminatedUnion, ZodDiscriminatedUnionOption } from "zod";
import { Integer } from "neo4j-driver";
import { isZodDiscriminatedUnion } from "../utilities/isZodDiscriminatedUnion";
import { AnyRelationshipDefinitionSet, CardinalityTypeSet, DependencyTypeSet, GenericRelationshipDefinitionSet, RelationshipDefinition } from "./RelationshipDefinition";

export type GenericNodeDefinitionSet = readonly GenericNodeDefinition[];
export type AnyNodeDefinitionSet = readonly AnyNodeDefinition[];
export type AnyNodeDefinitionMap = NodeDefinitionMap<AnyNodeDefinitionSet>;
export type GenericNodeDefinitionMap = NodeDefinitionMap<GenericNodeDefinitionSet>;
export type NodeDefinitionMap<NodeDefinitionSet extends AnyNodeDefinitionSet> = {
    [Type in NodeDefinitionSet[number]['type']]: (NodeDefinitionSet[number] & { type: Type });
};
export type NodeState<T extends AnyNodeDefinition> = TypeOf<T['stateSchema']>;
export type AnyNodeShape = NodeShape<AnyNodeDefinition>;
export type GenericNodeShape = NodeShape<GenericNodeDefinition>;
export type NodeShape<T extends AnyNodeDefinition> = NodeState<T> & {
    nodeId: string;
    nodeType: T['type'];
    createdAt: number;
    updatedAt: number;
};
export type GenericNeo4jNodeShape = Neo4jNodeShape<GenericNodeDefinition>;
export type AnyNeo4jNodeShape = Neo4jNodeShape<AnyNodeDefinition>;
export type Neo4jNodeShape<T extends AnyNodeDefinition> = NodeState<T> & {
    nodeId: string;
    nodeType: T['type'];
    createdAt: Integer;
    updatedAt: Integer;
};
export type AnyZodDiscriminatedUnion = ZodDiscriminatedUnion<any, any>;

export type AnyNodeDefinition = NodeDefinition<any, any, any, any>;
export type GenericNodeDefinition = NodeDefinition<
    Capitalize<string>,
    AnyZodObject | AnyZodDiscriminatedUnion,
    ['nodeId'],
    GenericRelationshipDefinitionSet
>;
export class NodeDefinition<
    Type extends Capitalize<string> = Capitalize<string>,
    StateSchema extends ZodTypeAny = AnyZodObject,
    UniqueIndexes extends (readonly (keyof TypeOf<StateSchema> | 'nodeId')[]) | ['nodeId'] = ['nodeId'],
    RelationshipDefinitionSet extends AnyRelationshipDefinitionSet | [] = [],
> {
    /**
     * Creates an instance of NodeDefinition.
     * @param type The type of the node.
     * @param stateSchema The Zod schema for the state of the node.
     * @param uniqueIndexes The unique indexes for the node.
     * @param relationshipTypeSet The relationship types for the node.
     * @param shapeSchema The Zod schema for the shape of the node.
     */
    constructor(
        public type: Type,
        public stateSchema: StateSchema,
        public uniqueIndexes: UniqueIndexes = ['nodeId'] as UniqueIndexes,
        public relationshipDefinitionSet: RelationshipDefinitionSet = [] as RelationshipDefinitionSet,
        public shapeSchema = isZodDiscriminatedUnion(stateSchema) ? z.union(stateSchema.options.map((option: AnyZodObject) => option.merge(z.object({
            nodeId: z.string(),
            nodeType: z.string()
        }))) as [AnyZodObject, AnyZodObject, ...AnyZodObject[]])
            : (stateSchema as unknown as AnyZodObject).merge(z.object({
                nodeId: z.string(),
                nodeType: z.literal(type),
                createdAt: z.string(),
                updatedAt: z.string()
            })),
    ) { }

    /**
     * Defines unique indexes for the node type.
     * @param indexes The unique indexes to define.
     * @returns A new NodeDefinition instance with the defined unique indexes.
     */
    defineUniqueIndexes<UniqueIndexes extends readonly (keyof TypeOf<StateSchema>)[]>(
        indexes: UniqueIndexes
    ) {
        return new NodeDefinition(
            this.type,
            this.stateSchema,
            [...indexes, 'nodeId'],
            this.relationshipDefinitionSet
        );
    }
    defineRelationship = <
        RelationshipType extends Uppercase<string>,
        Cardinality extends CardinalityTypeSet,
        Dependency extends DependencyTypeSet,
        ToNodeDefinition extends AnyNodeDefinition,
        RelationshipStateSchema extends ZodObject<any> | undefined = undefined
    >({
        relationshipType,
        cardinality,
        dependency,
        toNodeDefinition,
        relationshipStateSchema
    }:{
        relationshipType: RelationshipType,
        cardinality: Cardinality,
        dependency: Dependency,
        toNodeDefinition: ToNodeDefinition,
        relationshipStateSchema?: RelationshipStateSchema
    }) => {
        return new NodeDefinition(
            this.type,
            this.stateSchema,
            this.uniqueIndexes,
            [
                ...(this.relationshipDefinitionSet),
                new RelationshipDefinition(
                    this,
                    relationshipType,
                    cardinality,
                    dependency,
                    toNodeDefinition,
                    relationshipStateSchema as RelationshipStateSchema
                )
            ] as const,
        );
    }
}

//  ___       __ _                 
// |   \ ___ / _(_)_ _  ___ _ _ ___
// | |) / -_)  _| | ' \/ -_) '_(_-<
// |___/\___|_| |_|_||_\___|_| /__/

export const defineNode = <
    Type extends Capitalize<string>,
    StateSchema extends ZodTypeAny,
>(
    type: Type,
    stateSchema: StateSchema
) => new NodeDefinition(type, stateSchema);

export const defineRootNode = () => defineNode('Root', z.object({}));


