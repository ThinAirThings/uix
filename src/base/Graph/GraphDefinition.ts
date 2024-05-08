import { ZodObject } from "zod";
import { NodeDefinition } from "../Node/NodeDefinition";
import { RelationshipDefinition } from "../Relationship/RelationshipDefinition";





export class GraphDefinition<
    N extends readonly NodeDefinition<any, any, any, any>[],
    R extends readonly RelationshipDefinition<any, any, any, any>[],
> {
    nodeDefinitions: N;
    relationshipDefinitions: R;
    constructor(
        nodeDefinitions: N,
        relationshipDefinitions: R
    ) {
        this.nodeDefinitions = nodeDefinitions;
        this.relationshipDefinitions = relationshipDefinitions;
    }
    defineRelationship<
        FromNode extends readonly N[number]['nodeType'][],
        T extends Uppercase<string>,
        ToNode extends readonly N[number]['nodeType'][],
        StateDefinition extends ZodObject<any> | undefined = undefined,
    >(
        fromNode: FromNode,
        relationshipType: T,
        toNode: ToNode,
        stateDefinition?: StateDefinition,
    ) {
        return new GraphDefinition<N, [...R, RelationshipDefinition<
            FromNode, T, ToNode, StateDefinition
        >]>(this.nodeDefinitions, [...this.relationshipDefinitions, {
            fromNode,
            relationshipType,
            toNode,
            stateDefinition,
        }])
    }
}