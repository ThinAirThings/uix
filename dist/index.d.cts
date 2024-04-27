import * as zod from 'zod';
import { ZodObject, TypeOf, ZodRawShape } from 'zod';
import { Result } from 'ts-results';
import { Driver } from 'neo4j-driver';

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

type UixRelationship<T extends Uppercase<string>, S extends Record<string, any> | void> = {
    relationshipType: T;
    relationshipId: string;
    createdAt: string;
    updatedAt?: string;
} & {
    [K in keyof S as Exclude<K, 'relationshipType' | 'relationshipId' | 'createdAt' | 'updatedAt'>]: S[K];
};

declare class UixError<Layer extends string, T extends string> extends Error {
    layer: Layer;
    errorType: T | 'NodeNotFound';
    constructor(layer: Layer, errorType: UixError<Layer, T>['errorType'], ...[message, options]: ConstructorParameters<typeof Error>);
}

type GraphLayer<N extends readonly ReturnType<typeof defineNode<any, any>>[], R extends readonly {
    relationshipType: Uppercase<string>;
    uniqueFromNode?: boolean;
    stateDefinition?: ZodObject<any>;
}[], E extends Readonly<{
    [NT in (N[number]['nodeType'])]?: {
        [RT in R[number]['relationshipType']]?: readonly N[number]['nodeType'][];
    };
}>, UIdx extends {
    [T in N[number]['nodeType']]?: readonly (keyof TypeOf<(N[number] & {
        nodeType: T;
    })['stateDefinition']>)[];
}, LayerError extends UixError<any, any> = UixError<any, any>> = {
    nodeDefinitions: N;
    relationshipDefinitions: R;
    edgeDefinitions: E;
    uniqueIndexes: UIdx;
    createNode: <T extends N[number]['nodeType']>(nodeType: T, initialState: TypeOf<(N[number] & {
        nodeType: T;
    })['stateDefinition']>) => Promise<Result<NodeKey<T>, LayerError>>;
    getNode: <T extends N[number]['nodeType']>(nodeType: T, nodeIndex: UIdx[T] extends string[] ? UIdx[T][number] | 'nodeId' : 'nodeId', indexKey: string) => Promise<Result<UixNode<T, TypeOf<(N[number] & {
        nodeType: T;
    })['stateDefinition']>>, LayerError>>;
    updateNode: <T extends N[number]['nodeType']>(nodeKey: NodeKey<T>, state: Partial<TypeOf<(N[number] & {
        nodeType: T;
    })['stateDefinition']>>) => Promise<Result<UixNode<T, TypeOf<(N[number] & {
        nodeType: T;
    })['stateDefinition']>>, LayerError>>;
    deleteNode: <T extends N[number]['nodeType']>(nodeKey: NodeKey<T>) => Promise<Result<null, LayerError>>;
    createRelationship: <FromNodeType extends (keyof E & Capitalize<string>), RelationshipType extends ((keyof E[FromNodeType]) & Uppercase<string>), ToNodeType extends E[FromNodeType][RelationshipType] extends readonly any[] ? E[FromNodeType][RelationshipType][number] : never>(fromNode: NodeKey<FromNodeType>, relationshipType: RelationshipType, toNode: Result<NodeKey<ToNodeType>, LayerError> | NodeKey<ToNodeType>, ...[state]: NonNullable<(R[number] & {
        relationshipType: RelationshipType;
    })['stateDefinition']> extends ZodObject<ZodRawShape> ? [TypeOf<NonNullable<(R[number] & {
        relationshipType: RelationshipType;
    })['stateDefinition']>>] : []) => Promise<Result<{
        fromNode: UixNode<FromNodeType, TypeOf<(N[number] & {
            nodeType: FromNodeType;
        })['stateDefinition']>>;
        relationship: UixRelationship<RelationshipType, TypeOf<NonNullable<(R[number] & {
            relationshipType: RelationshipType;
        })['stateDefinition']>>>;
        toNode: UixNode<ToNodeType, TypeOf<(N[number] & {
            nodeType: ToNodeType;
        })['stateDefinition']>>;
    }, LayerError>>;
    getRelatedTo: <FromNodeType extends keyof E, RelationshipType extends ((keyof E[FromNodeType]) & R[number]['relationshipType']), ToNodeType extends E[FromNodeType][RelationshipType] extends readonly any[] ? E[FromNodeType][RelationshipType][number] : never>(fromNode: NodeKey<FromNodeType & Capitalize<string>>, relationshipType: RelationshipType, toNodeType: ToNodeType) => Promise<Result<UixNode<ToNodeType, TypeOf<(N[number] & {
        nodeType: ToNodeType;
    })['stateDefinition']>>[], LayerError>>;
    getDefinition: <T extends N[number]['nodeType']>(nodeType: T) => ReturnType<typeof defineNode<any, any>>;
};

type OmitNodeConstants<T extends UixNode<any, any>> = Omit<T, 'nodeType' | 'nodeId' | 'createdAt' | 'updatedAt'>;
declare const defineBaseGraph: <N extends readonly {
    nodeType: any;
    stateDefinition: any;
}[], R extends readonly {
    relationshipType: Uppercase<string>;
    uniqueFromNode?: boolean | undefined;
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
}) => Pick<GraphLayer<N, R, E, UIdx>, 'nodeDefinitions' | 'relationshipDefinitions' | 'edgeDefinitions' | 'uniqueIndexes' | 'createNode' | 'getDefinition'>;

declare class Neo4jLayerError extends UixError<'Neo4j', 'Neo4jConnection' | 'Unknown' | 'UniqueIndexViolation' | 'NodeNotFound' | 'UniqueFromNodeRelationshipViolation'> {
    constructor(errorType: Neo4jLayerError['errorType'], ...[message, options]: ConstructorParameters<typeof Error>);
}

declare const defineNeo4jLayer: <N extends readonly {
    nodeType: any;
    stateDefinition: any;
}[], R extends readonly {
    relationshipType: Uppercase<string>;
    uniqueFromNode?: boolean | undefined;
    stateDefinition?: ZodObject<any, zod.UnknownKeysParam, zod.ZodTypeAny, {
        [x: string]: any;
    }, {
        [x: string]: any;
    }> | undefined;
}[], E extends { [NT in N[number]["nodeType"]]?: { [RT in R[number]["relationshipType"]]?: readonly N[number]["nodeType"][] | undefined; } | undefined; }, UIdx extends { [T in N[number]["nodeType"]]?: readonly (keyof TypeOf<(N[number] & {
    nodeType: T;
})["stateDefinition"]>)[] | undefined; }>(graph: Pick<GraphLayer<N, R, E, UIdx>, 'relationshipDefinitions' | 'edgeDefinitions' | 'nodeDefinitions' | 'uniqueIndexes' | 'createNode' | 'getDefinition'>, config: {
    connection: {
        uri: string;
        username: string;
        password: string;
    };
}) => GraphLayer<N, R, E, UIdx, Neo4jLayerError> & {
    neo4jDriver: Driver;
};

declare class NextjsCacheLayerError extends UixError<'Nextjs', 'Unknown'> {
    constructor(errorType: NextjsCacheLayerError['errorType'], ...[message, options]: ConstructorParameters<typeof Error>);
}

declare const defineNextjsCacheLayer: <N extends readonly {
    nodeType: any;
    stateDefinition: any;
}[], R extends readonly {
    relationshipType: Uppercase<string>;
    uniqueFromNode?: boolean | undefined;
    stateDefinition?: ZodObject<any, zod.UnknownKeysParam, zod.ZodTypeAny, {
        [x: string]: any;
    }, {
        [x: string]: any;
    }> | undefined;
}[], E extends { [NT in N[number]["nodeType"]]?: { [RT in R[number]["relationshipType"]]?: readonly N[number]["nodeType"][] | undefined; } | undefined; }, UIdx extends { [T in N[number]["nodeType"]]?: readonly (keyof TypeOf<(N[number] & {
    nodeType: T;
})["stateDefinition"]>)[] | undefined; }>(graph: GraphLayer<N, R, E, UIdx>) => GraphLayer<N, R, E, UIdx, NextjsCacheLayerError>;

type GraphNodeType<G extends Pick<GraphLayer<any, any, any, any, any>, 'nodeDefinitions'>, T extends G extends Pick<GraphLayer<infer N extends {
    nodeType: string;
    stateDefinition: ZodObject<any>;
}[], any, any, any, any>, 'nodeDefinitions'> ? N[number]['nodeType'] : never> = UixNode<T, TypeOf<(G extends Pick<GraphLayer<infer N extends {
    nodeType: string;
    stateDefinition: ZodObject<any>;
}[], any, any, any, any>, 'nodeDefinitions'> ? (N[number] & {
    nodeType: T;
})['stateDefinition'] : never)>>;

export { type GraphLayer, type GraphNodeType, type OmitNodeConstants, type UixNode, defineBaseGraph, defineNeo4jLayer, defineNextjsCacheLayer, defineNode };
