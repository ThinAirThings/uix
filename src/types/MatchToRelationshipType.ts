import { AnyNodeType, GenericNodeType } from "./NodeType";


/**
 * Represents a set of generic weighted node types.
 */
export type GenericWeightedNodeTypeSet = readonly GenericWeightedNodeType[];
/**
 * Represents a generic weighted node type.
 */
export type GenericWeightedNodeType = WeightedNodeType<GenericNodeType>;
/**
 * Represents any set of weighted node types.
 */
export type AnyWeightedNodeTypeSet = readonly AnyWeightedNodeType[];
/**
 * Represents any weighted node type.
 */
export type AnyWeightedNodeType = WeightedNodeType<any>;
/**
 * Represents a weighted node type.
 */
export type WeightedNodeType<
    NodeType extends AnyNodeType,
> = {
    weight: number;
    NodeType: NodeType;
};
/**
 * Represents a generic set of match-to relationship types.
 */
export type GenericMatchToRelationshipTypeSet = readonly GenericMatchToRelationshipType[];
/**
 * Represents a generic match-to relationship type.
 */
export type GenericMatchToRelationshipType = MatchToRelationshipType<
    Capitalize<string>,
    GenericNodeType,
    GenericWeightedNodeTypeSet
>;
/**
 * Represents any set of match-to relationship types.
 */
export type AnyMatchToRelationshipTypeSet = readonly AnyMatchToRelationshipType[];
/**
 * Represents any match-to relationship type.
 */
export type AnyMatchToRelationshipType = MatchToRelationshipType<any, any, any>;
/**
 * Represents a match-to relationship type.
 */
export class MatchToRelationshipType<
    Type extends Capitalize<string> = Capitalize<string>,
    MatchToNodeType extends AnyNodeType = GenericNodeType,
    WeightedNodeTypeSet extends AnyWeightedNodeTypeSet = GenericWeightedNodeTypeSet,
> {
    constructor(
        public type: Type,
        public description: string,
        public matchToNodeType: MatchToNodeType,
        public weightedNodeTypeSet: WeightedNodeTypeSet,
    ) { }
}