import * as zod from 'zod';
import { ZodObject, TypeOf, ZodRawShape } from 'zod';

type UixNode<T extends Capitalize<string>, S extends Record<string, any>> = {
    nodeType: T;
    nodeId: string;
    createdAt: string;
    updatedAt?: string;
} & {
    [K in keyof S as Exclude<K, 'nodeType' | 'nodeId' | 'createdAt' | 'updatedAt'>]: S[K];
};

declare const defineNode: <T extends Capitalize<string>, SD extends ZodObject<any, zod.UnknownKeysParam, zod.ZodTypeAny, {
    [x: string]: any;
}, {
    [x: string]: any;
}>>(nodeType: T, stateDefinition: SD) => {
    nodeType: T;
    stateDefinition: SD;
};

type NodeKey<T extends Capitalize<string>> = {
    nodeType: T;
    nodeId: string;
};

type GraphLayer<N extends readonly ReturnType<typeof defineNode<any, any>>[], R extends {
    [K in N[number]['nodeType']]?: {
        [R: Uppercase<string>]: {
            toNodeType: readonly N[number]['nodeType'][];
            stateDefinition?: ZodObject<any>;
        };
    };
}, UIdx extends {
    [T in N[number]['nodeType']]?: readonly (keyof TypeOf<(N[number] & {
        nodeType: T;
    })['stateDefinition']>)[];
}> = {
    nodeDefinitions: N;
    relationshipDefinitions: R;
    uniqueIndexes: UIdx;
    createNode: <T extends N[number]['nodeType']>(nodeType: T, initialState: TypeOf<(N[number] & {
        nodeType: T;
    })['stateDefinition']>) => Promise<UixNode<T, TypeOf<(N[number] & {
        nodeType: T;
    })['stateDefinition']>>>;
    getNode: <T extends N[number]['nodeType']>(nodeType: T, nodeIndex: UIdx[T] extends string[] ? UIdx[T][number] | 'nodeId' : 'nodeId', indexKey: string) => Promise<UixNode<T, TypeOf<(N[number] & {
        nodeType: T;
    })['stateDefinition']>>>;
    updateNode: <T extends N[number]['nodeType']>(nodeKey: NodeKey<T>, state: Partial<TypeOf<(N[number] & {
        nodeType: T;
    })['stateDefinition']>>) => Promise<UixNode<T, TypeOf<(N[number] & {
        nodeType: T;
    })['stateDefinition']>>>;
    createRelationship: <NodeType extends N[number]['nodeType'], RelationshipType extends (keyof (R[NodeType]))>(fromNode: NodeKey<NodeType>, relationshipType: RelationshipType, toNode: NodeKey<{
        [RelationshipTypeKey in keyof R[NodeType]]: {
            [Key in keyof R[NodeType][RelationshipTypeKey]]: R[NodeType][RelationshipTypeKey][Key] extends any[] ? R[NodeType][RelationshipTypeKey][Key][number] extends Capitalize<string> ? R[NodeType][RelationshipTypeKey][Key][number] : never : R[NodeType][RelationshipTypeKey][Key] extends Capitalize<string> ? R[NodeType][RelationshipTypeKey][Key] : never;
        }[keyof R[NodeType][RelationshipTypeKey]];
    }[keyof R[NodeType]]>, ...[state]: {
        [RelationshipTypeKey in keyof R[NodeType]]: {
            [Key in keyof R[NodeType][RelationshipTypeKey]]: R[NodeType][RelationshipTypeKey][Key] extends ZodObject<ZodRawShape> ? R[NodeType][RelationshipTypeKey][Key] extends ZodObject<ZodRawShape> ? [TypeOf<R[NodeType][RelationshipTypeKey][Key]>] : [] : never;
        }[keyof R[NodeType][RelationshipTypeKey]];
    }[keyof R[NodeType]]) => void;
    getRelatedTo: <FromNodeType extends N[number]['nodeType'], RelationshipType extends (keyof (R[FromNodeType])), ToNodeType extends {
        [RelationshipTypeKey in keyof R[FromNodeType]]: {
            [Key in keyof R[FromNodeType][RelationshipTypeKey]]: R[FromNodeType][RelationshipTypeKey][Key] extends any[] ? R[FromNodeType][RelationshipTypeKey][Key][number] extends Capitalize<string> ? R[FromNodeType][RelationshipTypeKey][Key][number] : never : R[FromNodeType][RelationshipTypeKey][Key] extends Capitalize<string> ? R[FromNodeType][RelationshipTypeKey][Key] : never;
        }[keyof R[FromNodeType][RelationshipTypeKey]];
    }[keyof R[FromNodeType]]>(fromNode: NodeKey<FromNodeType>, relationshipType: RelationshipType, toNodeType: ToNodeType) => Promise<UixNode<ToNodeType, TypeOf<(N[number] & {
        nodeType: ToNodeType;
    })['stateDefinition']>>[]>;
};

type OmitNodeContants<T extends UixNode<any, any>> = Omit<T, 'nodeType' | 'nodeId' | 'createdAt' | 'updatedAt'>;
declare const defineGraph: <N extends readonly {
    nodeType: any;
    stateDefinition: any;
}[], R extends { [K in N[number]["nodeType"]]?: {
    [R: Uppercase<string>]: {
        toNodeType: readonly N[number]["nodeType"][];
        stateDefinition?: ZodObject<any, zod.UnknownKeysParam, zod.ZodTypeAny, {
            [x: string]: any;
        }, {
            [x: string]: any;
        }> | undefined;
    };
} | undefined; }, UIdx extends { [T in N[number]["nodeType"]]?: readonly (keyof TypeOf<(N[number] & {
    nodeType: T;
})["stateDefinition"]>)[] | undefined; }>({ nodeDefinitions, relationshipDefinitions, uniqueIndexes }: {
    nodeDefinitions: N;
    relationshipDefinitions: R;
    uniqueIndexes: UIdx;
}) => Pick<GraphLayer<N, R, UIdx>, 'nodeDefinitions' | 'relationshipDefinitions' | 'uniqueIndexes' | 'createNode' | 'createRelationship'>;

declare const Neo4jLayer: <N extends readonly {
    nodeType: Capitalize<string>;
    stateDefinition: any;
}[], R extends { [K in N[number]["nodeType"]]?: {
    [R: Uppercase<string>]: {
        toNodeType: readonly N[number]["nodeType"][];
        stateDefinition?: ZodObject<any, zod.UnknownKeysParam, zod.ZodTypeAny, {
            [x: string]: any;
        }, {
            [x: string]: any;
        }> | undefined;
    };
} | undefined; }, UIdx extends { [T in N[number]["nodeType"]]?: readonly (keyof TypeOf<(N[number] & {
    nodeType: T;
})["stateDefinition"]>)[] | undefined; }, G extends Pick<GraphLayer<N, R, UIdx>, "createRelationship" | "nodeDefinitions" | "relationshipDefinitions" | "uniqueIndexes" | "createNode">>(graph: G, { nodeDefinitions, relationshipDefinitions, uniqueIndexes }: {
    nodeDefinitions: N;
    relationshipDefinitions: R;
    uniqueIndexes: UIdx;
}, config: {
    connection: {
        uri: string;
        user: string;
        password: string;
    };
}) => GraphLayer<N, R, UIdx>;

export { Neo4jLayer, type OmitNodeContants, defineGraph, defineNode };
