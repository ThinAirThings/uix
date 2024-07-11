/**
 * @fileoverview Defines the NodeType class and related types for defining node types in a graph database.
 * @module NodeType
 */

import { TypeOf, ZodObject, ZodOptional, ZodTypeAny, z, ZodString, ZodRawShape, ZodLiteral, AnyZodObject, ZodDefault, ZodType, ZodDiscriminatedUnion } from "zod";
import { AnyRelationshipTypeSet, GenericRelationshipTypeSet, RelationshipType } from "./RelationshipType";
import { Integer } from "neo4j-driver";
import { AnyMatchToRelationshipTypeSet, AnyWeightedNodeTypeSet, GenericMatchToRelationshipTypeSet, MatchToRelationshipType } from "./MatchToRelationshipType";

/**
 * Represents any node type.
 */
export type AnyNodeType = NodeType<any, any, any, any, any, any>;

/**
 * Represents a generic node type.
 */
export type GenericNodeType = NodeType<
    Capitalize<string>,
    AnyZodObject | AnyZodDiscriminatedUnion,
    ['nodeId'],
    [],
    GenericRelationshipTypeSet,
    GenericMatchToRelationshipTypeSet
// ((node: NodeShape<GenericNodeType>) => JSX.Element) | undefined
>;

/**
 * Represents a set of generic node types.
 */
export type GenericNodeTypeSet = readonly GenericNodeType[];

/**
 * Represents any node type set.
 */
export type AnyNodeTypeSet = readonly AnyNodeType[];

/**
 * Represents a mapping of any node type.
 */
export type AnyNodeTypeMap = NodeTypeMap<AnyNodeTypeSet>;

/**
 * Represents a mapping of generic node types.
 */
export type GenericNodeTypeMap = NodeTypeMap<GenericNodeTypeSet>;

/**
 * Represents a mapping of node types.
 */
export type NodeTypeMap<NodeTypeSet extends AnyNodeTypeSet> = {
    [Type in NodeTypeSet[number]['type']]: (NodeTypeSet[number] & { type: Type });
};

/**
 * Represents the state of a node.
 */
export type NodeState<T extends AnyNodeType> = TypeOf<T['stateSchema']>;

/**
 * Represents the shape of any node.
 */
export type AnyNodeShape = NodeShape<AnyNodeType>;

/**
 * Represents the shape of a generic node.
 */
export type GenericNodeShape = NodeShape<GenericNodeType>;

/**
 * Represents the shape of a node.
 */
export type NodeShape<T extends AnyNodeType> = NodeState<T> & {
    nodeId: string;
    nodeType: T['type'];
    createdAt: number;
    updatedAt: number;
};

/**
 * Represents the shape of a generic Neo4j node.
 */
export type GenericNeo4jNodeShape = Neo4jNodeShape<GenericNodeType>;

/**
 * Represents the shape of any Neo4j node.
 */
export type AnyNeo4jNodeShape = Neo4jNodeShape<AnyNodeType>;

/**
 * Represents the shape of a Neo4j node.
 */
export type Neo4jNodeShape<T extends AnyNodeType> = NodeState<T> & {
    nodeId: string;
    nodeType: T['type'];
    createdAt: Integer;
    updatedAt: Integer;
};

/**
 * Represents the shape of a vector node.
 */
export type VectorNodeShape<T extends AnyNodeType> = ({
    [K in keyof TypeOf<T['stateSchema']> as K extends T['propertyVectors'][number]
    ? K
    : never
    ]-?: number[];
}) & ({
    nodeId: string;
    nodeType: T['type'];
    createdAt: string;
    updatedAt: string;
}) & (T['matchToRelationshipTypeSet'] extends AnyMatchToRelationshipTypeSet
    ? {
        nodeTypeSummary: string;
        nodeTypeEmbedding: number[];
    } : {});

/**
 * Represents the parent types of a node set.
 */
export type NodeSetParentTypes<NodeTypeMap extends AnyNodeTypeMap> = {
    [Type in keyof NodeTypeMap]: (NodeTypeMap[Type]['relationshipTypeSet'][number] & { relationshipClass: 'Set' }) extends AnyRelationshipTypeSet
    ? never
    : Type;
}[keyof NodeTypeMap];

/**
 * Represents the unique parent types of a node set.
 */
export type UniqueParentTypes<NodeTypeMap extends AnyNodeTypeMap> = {
    [Type in keyof NodeTypeMap]: (NodeTypeMap[Type]['relationshipTypeSet'][number] & { relationshipClass: 'Unique' }) extends AnyRelationshipTypeSet
    ? never
    : Type;
}[keyof NodeTypeMap];

/**
 * Represents the child node types of a node set.
 */
export type NodeSetChildNodeTypes<
    NodeTypeMap extends AnyNodeTypeMap,
    ParentNodeType extends keyof NodeTypeMap
> = NodeTypeMap[ParentNodeType] extends NodeType<any, any, any, any, infer RelationshipTypeSet, any>
    ? (RelationshipTypeSet[number] & { relationshipClass: 'Set' })['toNodeType']['type']
    : never

/**
 * Represents the unique child node types of a node set.
 */
export type UniqueChildNodeTypes<
    NodeTypeMap extends AnyNodeTypeMap,
    ParentNodeType extends keyof NodeTypeMap
> = NodeTypeMap[ParentNodeType] extends NodeType<any, any, any, any, infer RelationshipTypeSet, any>
    ? (RelationshipTypeSet[number] & { relationshipClass: 'Unique' }) extends RelationshipType<'Unique', any, any, infer ToNodeType, any>
    ? ToNodeType['type']
    : never
    : never
/**
 * Represents the string properties of a Zod object.
 */
type StringProperties<T extends ZodTypeAny> = {
    [K in keyof TypeOf<T>]: NonNullable<TypeOf<T>[K]> extends string ? K : never;
}[keyof TypeOf<T>];

/**
 * Represents a map of triggers for a node shape.
 */
type TriggerMap<NodeShape extends AnyNodeShape> = Map<'onCreate' | 'onUpdate' | 'onDelete',
    Map<string, (node: NodeShape) => void>
>;

export type AnyZodDiscriminatedUnion = ZodDiscriminatedUnion<any, any>;
/**
 * Represents a node type in a graph database.
 */
export class NodeType<
    Type extends Capitalize<string> = Capitalize<string>,
    StateSchema extends ZodTypeAny = AnyZodObject,
    UniqueIndexes extends (readonly (keyof TypeOf<StateSchema> | 'nodeId')[]) | ['nodeId'] = ['nodeId'],
    PropertyVectors extends (readonly (StringProperties<StateSchema>)[]) | [] = [],
    RelationshipTypeSet extends AnyRelationshipTypeSet | [] = [],
    MatchToRelationshipTypeSet extends AnyMatchToRelationshipTypeSet | [] = [],
// ComponentFunction extends ((node: NodeShape<NodeType<Type, StateSchema>>) => JSX.Element) | undefined = undefined
> {
    /**
     * Creates an instance of NodeType.
     * @param type The type of the node.
     * @param stateSchema The Zod schema for the state of the node.
     * @param uniqueIndexes The unique indexes for the node.
     * @param propertyVectors The property vectors for the node.
     * @param relationshipTypeSet The relationship types for the node.
     * @param matchToRelationshipTypeSet The match-to relationship types for the node.
     * @param shapeSchema The Zod schema for the shape of the node.
     */
    constructor(
        public type: Type,
        public stateSchema: StateSchema,
        public uniqueIndexes: UniqueIndexes = ['nodeId'] as UniqueIndexes,
        public propertyVectors: PropertyVectors = [] as PropertyVectors,
        public relationshipTypeSet: RelationshipTypeSet = [] as RelationshipTypeSet,
        public matchToRelationshipTypeSet: MatchToRelationshipTypeSet = [] as MatchToRelationshipTypeSet,
        // public Component: ComponentFunction = undefined as ComponentFunction,
        public shapeSchema = z.object({
            nodeId: z.string(),
            nodeType: z.literal(type),
            createdAt: z.string(),
            updatedAt: z.string()
        }).merge(stateSchema instanceof ZodDiscriminatedUnion ? stateSchema.options : stateSchema),
    ) { }

    /**
     * Defines unique indexes for the node type.
     * @param indexes The unique indexes to define.
     * @returns A new NodeType instance with the defined unique indexes.
     */
    defineUniqueIndexes<UniqueIndexes extends readonly (keyof TypeOf<StateSchema>)[]>(
        indexes: UniqueIndexes
    ) {
        return new NodeType(
            this.type,
            this.stateSchema,
            [...indexes, 'nodeId'],
            this.propertyVectors,
            this.relationshipTypeSet,
            this.matchToRelationshipTypeSet
        );
    }

    /**
     * Defines a match-to relationship type for the node type.
     * @param matchToRelationshipType The match-to relationship type to define.
     * @returns A new NodeType instance with the defined match-to relationship type.
     */
    defineMatchToRelationshipType<
        RelType extends Capitalize<string>,
        MatchToNodeType extends AnyNodeType,
        WeightedNodeTypeSet extends AnyWeightedNodeTypeSet
    >({
        type,
        description,
        matchToNodeType,
        weightedNodeTypeSet
    }: {
        type: RelType,
        description: string,
        matchToNodeType: MatchToNodeType,
        weightedNodeTypeSet: WeightedNodeTypeSet
    }) {
        return new NodeType(
            this.type,
            this.stateSchema,
            this.uniqueIndexes,
            this.propertyVectors,
            this.relationshipTypeSet,
            [...this.matchToRelationshipTypeSet, new MatchToRelationshipType(
                type,
                description,
                matchToNodeType,
                weightedNodeTypeSet
            )],
        );
    }

    /**
     * Defines a property vector for the node type.
     * @param propertyKeys The property keys to define as a property vector.
     * @returns A new NodeType instance with the defined property vector.
     */
    definePropertyVector<PropertyKey extends readonly (StringProperties<StateSchema>)[]>(
        propertyKeys: PropertyKey
    ) {
        return new NodeType(
            this.type,
            this.stateSchema,
            this.uniqueIndexes,
            [...this.propertyVectors, ...propertyKeys],
            this.relationshipTypeSet,
            this.matchToRelationshipTypeSet
        );
    }

    /**
     * Defines a unique relationship for the node type.
     * @param toNodeType The node type to define a unique relationship to.
     * @returns A new NodeType instance with the defined unique relationship.
     */
    defineUniqueRelationship<
        ToNodeType extends AnyNodeType
    >(
        toNodeType: ToNodeType,
    ) {
        return new NodeType(
            this.type,
            this.stateSchema,
            this.uniqueIndexes,
            this.propertyVectors,
            [
                ...(this.relationshipTypeSet),
                new RelationshipType(
                    'Unique' as const,
                    this,
                    `UNIQUE_TO` as Uppercase<string>,
                    toNodeType,
                )
            ],
            this.matchToRelationshipTypeSet
        );
    }

    /**
     * Defines a node set relationship for the node type.
     * @param toNodeType The node type to define a node set relationship to.
     * @returns A new NodeType instance with the defined node set relationship.
     */
    defineNodeSetRelationship<
        ToNodeType extends AnyNodeType
    >(
        toNodeType: ToNodeType,
    ) {
        return new NodeType(
            this.type,
            this.stateSchema,
            this.uniqueIndexes,
            this.propertyVectors,
            [
                ...(this.relationshipTypeSet),
                new RelationshipType(
                    'Set' as const,
                    this,
                    `CHILD_TO` as Uppercase<string>,
                    toNodeType,
                )
            ],
            this.matchToRelationshipTypeSet
        );
    }
    defineEdgeRelationship<
        EdgeRelationshipType extends Uppercase<string>,
        ToNodeType extends AnyNodeType
    >(
        relationshipType: EdgeRelationshipType,
        toNodeType: ToNodeType
    ) {
        return new NodeType(
            this.type,
            this.stateSchema,
            this.uniqueIndexes,
            this.propertyVectors,
            [
                ...(this.relationshipTypeSet),
                new RelationshipType(
                    'Edge' as const,
                    this,
                    relationshipType,
                    toNodeType,
                )
            ],
            this.matchToRelationshipTypeSet
        );
    }
    // defineComponent(Component: (node: NodeShape<this>) => JSX.Element) {
    //     return new NodeType(
    //         this.type,
    //         this.stateSchema,
    //         this.uniqueIndexes,
    //         this.propertyVectors,
    //         this.relationshipTypeSet,
    //         this.matchToRelationshipTypeSet,
    //         Component
    //     );
    // }
}


//  ___       __ _                 
// |   \ ___ / _(_)_ _  ___ _ _ ___
// | |) / -_)  _| | ' \/ -_) '_(_-<
// |___/\___|_| |_|_||_\___|_| /__/

export const defineNodeType = <
    Type extends Capitalize<string>,
    StateSchema extends ZodTypeAny,
>(
    type: Type,
    stateSchema: StateSchema
) => new NodeType(type, stateSchema);


export const defineRootNodeType = () => defineNodeType('Root', z.object({}));

export const defineUserNodeType = <
    StateSchema extends AnyZodObject | AnyZodDiscriminatedUnion
>(
    stateSchema: StateSchema
) => defineNodeType('User', stateSchema);