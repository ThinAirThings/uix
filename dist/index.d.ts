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

type GraphLayer<N extends readonly ReturnType<typeof defineNode<any, any>>[], R extends readonly {
    relationshipType: Uppercase<string>;
    stateDefinition?: ZodObject<any>;
}[], E extends Readonly<{
    [NT in (N[number]['nodeType'])]?: {
        [RT in R[number]['relationshipType']]?: readonly N[number]['nodeType'][];
    };
}>, UIdx extends {
    [T in N[number]['nodeType']]?: readonly (keyof TypeOf<(N[number] & {
        nodeType: T;
    })['stateDefinition']>)[];
}> = {
    nodeDefinitions: N;
    relationshipDefinitions: R;
    edgeDefinitions: E;
    uniqueIndexes: UIdx;
    createRelationship: <NodeType extends keyof E, RelationshipType extends ((keyof E[NodeType])), ToNodeType extends E[NodeType][RelationshipType] extends readonly any[] ? E[NodeType][RelationshipType][number] : never>(fromNode: NodeKey<NodeType & Capitalize<string>>, relationshipType: RelationshipType, toNode: NodeKey<ToNodeType>, ...[state]: NonNullable<(R[number] & {
        relationshipType: RelationshipType;
    })['stateDefinition']> extends ZodObject<ZodRawShape> ? [TypeOf<NonNullable<(R[number] & {
        relationshipType: RelationshipType;
    })['stateDefinition']>>] : []) => void;
    getRelatedTo: <FromNodeType extends keyof E, RelationshipType extends ((keyof E[FromNodeType]) & R[number]['relationshipType']), ToNodeType extends E[FromNodeType][RelationshipType] extends any[] ? E[FromNodeType][RelationshipType][number] : never>(fromNode: NodeKey<FromNodeType & Capitalize<string>>, relationshipType: RelationshipType, toNodeType: ToNodeType) => Promise<UixNode<ToNodeType, TypeOf<(N[number] & {
        nodeType: ToNodeType;
    })['stateDefinition']>>[]>;
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
};

type OmitNodeContants<T extends UixNode<any, any>> = Omit<T, 'nodeType' | 'nodeId' | 'createdAt' | 'updatedAt'>;
declare const defineGraph: <N extends readonly {
    nodeType: any;
    stateDefinition: any;
}[], R extends readonly {
    relationshipType: Uppercase<string>;
    stateDefinition?: ZodObject<any, zod.UnknownKeysParam, zod.ZodTypeAny, {
        [x: string]: any;
    }, {
        [x: string]: any;
    }> | undefined;
}[], E extends { [NT in N[number]["nodeType"]]?: { [RT in R[number]["relationshipType"]]?: readonly N[number]["nodeType"][] | undefined; } | undefined; }, UIdx extends { [T in N[number]["nodeType"]]?: readonly (keyof TypeOf<(N[number] & {
    nodeType: T;
})["stateDefinition"]>)[] | undefined; }>({ nodeDefinitions, relationshipDefinitions, edgeDefinitions, uniqueIndexes }: {
    nodeDefinitions: N;
    relationshipDefinitions: R;
    edgeDefinitions: E;
    uniqueIndexes: UIdx;
}) => Pick<GraphLayer<N, R, E, UIdx>, 'nodeDefinitions' | 'relationshipDefinitions' | 'edgeDefinitions' | 'uniqueIndexes' | 'createNode' | 'createRelationship'>;

declare const Neo4jLayer: <N extends readonly {
    nodeType: any;
    stateDefinition: any;
}[], R extends readonly {
    relationshipType: Uppercase<string>;
    stateDefinition?: ZodObject<any, zod.UnknownKeysParam, zod.ZodTypeAny, {
        [x: string]: any;
    }, {
        [x: string]: any;
    }> | undefined;
}[], E extends { [NT in N[number]["nodeType"]]?: { [RT in R[number]["relationshipType"]]?: readonly N[number]["nodeType"][] | undefined; } | undefined; }, UIdx extends { [T in N[number]["nodeType"]]?: readonly (keyof TypeOf<(N[number] & {
    nodeType: T;
})["stateDefinition"]>)[] | undefined; }, G extends Pick<GraphLayer<N, R, E, UIdx>, "createRelationship" | "nodeDefinitions" | "relationshipDefinitions" | "edgeDefinitions" | "uniqueIndexes" | "createNode">>(graph: G, { nodeDefinitions, relationshipDefinitions, edgeDefinitions, uniqueIndexes }: {
    nodeDefinitions: N;
    relationshipDefinitions: R;
    edgeDefinitions: E;
    uniqueIndexes: UIdx;
}, config: {
    connection: {
        uri: string;
        user: string;
        password: string;
    };
}) => GraphLayer<N, R, E, UIdx>;

declare const NextjsCacheLayer: <N extends readonly {
    nodeType: any;
    stateDefinition: any;
}[], R extends readonly {
    relationshipType: Uppercase<string>;
    stateDefinition?: ZodObject<any, zod.UnknownKeysParam, zod.ZodTypeAny, {
        [x: string]: any;
    }, {
        [x: string]: any;
    }> | undefined;
}[], E extends { [NT in N[number]["nodeType"]]?: { [RT in R[number]["relationshipType"]]?: readonly N[number]["nodeType"][] | undefined; } | undefined; }, UIdx extends { [T in N[number]["nodeType"]]?: readonly (keyof TypeOf<(N[number] & {
    nodeType: T;
})["stateDefinition"]>)[] | undefined; }, G extends Pick<GraphLayer<N, R, E, UIdx>, "getNode" | "updateNode">>(graph: G, { nodeDefinitions, relationshipDefinitions, edgeDefinitions, uniqueIndexes }: {
    nodeDefinitions: N;
    relationshipDefinitions: R;
    edgeDefinitions: E;
    uniqueIndexes: UIdx;
}) => Pick<GraphLayer<N, R, E, UIdx>, 'getNode' | 'updateNode'>;

export { Neo4jLayer, NextjsCacheLayer, type OmitNodeContants, defineGraph, defineNode };
