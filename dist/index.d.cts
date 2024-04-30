import * as zod from 'zod';
import { ZodObject, TypeOf, ZodRawShape } from 'zod';
import { Driver } from 'neo4j-driver';
import * as _tanstack_react_query from '@tanstack/react-query';

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

declare const ExtendUixError: <LayerStack extends Capitalize<string>>() => <Layer extends LayerStack, T extends "Fatal" | "Normal" | "Warning" = "Fatal" | "Normal" | "Warning", ST extends "NodeNotFound" | "UniqueIndexViolation" | "UniqueRelationshipViolation" | "LayerImplementationError" = "NodeNotFound" | "UniqueIndexViolation" | "UniqueRelationshipViolation" | "LayerImplementationError", D extends Record<string, any> = Record<string, any>>(layer: Layer, type: T, subtype: ST, opts?: {
    message?: string;
    data?: D;
}) => {
    message?: string | undefined;
    data?: D | undefined;
    layer: Layer;
    type: T;
    subtype: ST;
};

type Result<T, E> = {
    ok: true;
    val: T;
} | {
    ok: false;
    val: E;
};
declare const Ok: <T>(val: T) => Result<T, never>;
declare const Err: <E>(val: E) => Result<never, E>;

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
}, LayerStack extends Capitalize<string>> = {
    nodeDefinitions: N;
    relationshipDefinitions: R;
    edgeDefinitions: E;
    uniqueIndexes: UIdx;
    createNode: <T extends N[number]['nodeType']>(nodeType: T, initialState: TypeOf<(N[number] & {
        nodeType: T;
    })['stateDefinition']>) => Promise<Result<UixNode<T, TypeOf<(N[number] & {
        nodeType: T;
    })['stateDefinition']>>, ReturnType<ReturnType<typeof ExtendUixError<LayerStack>>>>>;
    getNode: <T extends N[number]['nodeType']>(nodeType: T, nodeIndex: UIdx[T] extends string[] ? UIdx[T][number] | 'nodeId' : 'nodeId', indexKey: string) => Promise<Result<UixNode<T, TypeOf<(N[number] & {
        nodeType: T;
    })['stateDefinition']>>, ReturnType<ReturnType<typeof ExtendUixError<LayerStack>>>>>;
    getNodeType: <T extends N[number]['nodeType']>(nodeType: T) => Promise<Result<UixNode<T, TypeOf<(N[number] & {
        nodeType: T;
    })['stateDefinition']>>[], ReturnType<ReturnType<typeof ExtendUixError<LayerStack>>>>>;
    updateNode: <T extends N[number]['nodeType']>(nodeKey: NodeKey<T>, state: Partial<TypeOf<(N[number] & {
        nodeType: T;
    })['stateDefinition']>>) => Promise<Result<UixNode<T, TypeOf<(N[number] & {
        nodeType: T;
    })['stateDefinition']>>, ReturnType<ReturnType<typeof ExtendUixError<LayerStack>>>>>;
    deleteNode: <T extends N[number]['nodeType']>(nodeKey: NodeKey<T>) => Promise<Result<null, ReturnType<ReturnType<typeof ExtendUixError<LayerStack>>>>>;
    createRelationship: <FromNodeType extends (keyof E & Capitalize<string>), RelationshipType extends ((keyof E[FromNodeType]) & Uppercase<string>), ToNodeType extends E[FromNodeType][RelationshipType] extends readonly any[] ? E[FromNodeType][RelationshipType][number] : never>(fromNode: Result<NodeKey<FromNodeType>, ReturnType<ReturnType<typeof ExtendUixError<LayerStack>>>> | NodeKey<FromNodeType>, relationshipType: RelationshipType, toNode: {
        nodeType: ToNodeType;
        initialState: TypeOf<(N[number] & {
            nodeType: ToNodeType;
        })['stateDefinition']>;
    } | NodeKey<ToNodeType>, ...[state]: NonNullable<(R[number] & {
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
    }, ReturnType<ReturnType<typeof ExtendUixError<LayerStack>>>>>;
    getRelatedTo: <FromNodeType extends keyof E, RelationshipType extends ((keyof E[FromNodeType]) & R[number]['relationshipType']), ToNodeType extends E[FromNodeType][RelationshipType] extends readonly any[] ? E[FromNodeType][RelationshipType][number] : never>(fromNodeKey: NodeKey<FromNodeType & Capitalize<string>>, relationshipType: RelationshipType, toNodeType: ToNodeType) => Promise<Result<(R[number] & {
        relationshipType: RelationshipType;
    })['uniqueFromNode'] extends true ? UixNode<ToNodeType, TypeOf<(N[number] & {
        nodeType: ToNodeType;
    })['stateDefinition']>> : UixNode<ToNodeType, TypeOf<(N[number] & {
        nodeType: ToNodeType;
    })['stateDefinition']>>[], ReturnType<ReturnType<typeof ExtendUixError<LayerStack>>>>>;
    getNodeDefinition: <T extends N[number]['nodeType']>(nodeType: T) => ReturnType<typeof defineNode<T, (N[number] & {
        nodeType: T;
    })['stateDefinition']>>;
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
}) => Pick<GraphLayer<N, R, E, UIdx, 'Base'>, 'nodeDefinitions' | 'relationshipDefinitions' | 'edgeDefinitions' | 'uniqueIndexes' | 'createNode' | 'getNodeDefinition'>;

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
})["stateDefinition"]>)[] | undefined; }, PreviousLayers extends Capitalize<string>>(graph: Pick<GraphLayer<N, R, E, UIdx, PreviousLayers>, 'relationshipDefinitions' | 'edgeDefinitions' | 'nodeDefinitions' | 'uniqueIndexes' | 'createNode' | 'getNodeDefinition'>, config: {
    connection: {
        uri: string;
        username: string;
        password: string;
    };
}) => GraphLayer<N, R, E, UIdx, PreviousLayers | 'Neo4j'> & {
    neo4jDriver: Driver;
};

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
})["stateDefinition"]>)[] | undefined; }, PreviousLayers extends Capitalize<string>>(graph: GraphLayer<N, R, E, UIdx, PreviousLayers>) => Omit<GraphLayer<N, R, E, UIdx, PreviousLayers | "NextjsCache">, "createNode" | "createRelationship" | "getRelatedTo"> & {
    createNode: <T_1 extends N[number]["nodeType"]>(nodeType: T_1, initialState: TypeOf<(N[number] & {
        nodeType: T_1;
    })["stateDefinition"]>) => Promise<Result<NodeKey<T_1>, {
        message?: string | undefined;
        data?: Record<string, any> | undefined;
        layer: PreviousLayers | "NextjsCache";
        type: "Fatal" | "Normal" | "Warning";
        subtype: "NodeNotFound" | "UniqueIndexViolation" | "UniqueRelationshipViolation" | "LayerImplementationError";
    }>>;
    createRelationship: <FromNodeType extends keyof E & Capitalize<string>, RelationshipType extends keyof E[FromNodeType] & Uppercase<string>, ToNodeType extends E[FromNodeType][RelationshipType] extends readonly any[] ? E[FromNodeType][RelationshipType][number] : never>(fromNode: NodeKey<FromNodeType> | Result<NodeKey<FromNodeType>, {
        message?: string | undefined;
        data?: Record<string, any> | undefined;
        layer: PreviousLayers | "NextjsCache";
        type: "Fatal" | "Normal" | "Warning";
        subtype: "NodeNotFound" | "UniqueIndexViolation" | "UniqueRelationshipViolation" | "LayerImplementationError";
    }>, relationshipType: RelationshipType, toNode: {
        nodeType: ToNodeType;
        initialState: TypeOf<(N[number] & {
            nodeType: ToNodeType;
        })["stateDefinition"]>;
    } | NodeKey<ToNodeType>, ...[state]: NonNullable<(R[number] & {
        relationshipType: RelationshipType;
    })["stateDefinition"]> extends ZodObject<ZodRawShape, zod.UnknownKeysParam, zod.ZodTypeAny, {
        [x: string]: any;
    }, {
        [x: string]: any;
    }> ? [TypeOf<NonNullable<(R[number] & {
        relationshipType: RelationshipType;
    })["stateDefinition"]>>] : []) => Promise<Result<{
        fromNodeKey: NodeKey<FromNodeType>;
        relationship: UixRelationship<RelationshipType, TypeOf<NonNullable<(R[number] & {
            relationshipType: RelationshipType;
        })["stateDefinition"]>>>;
        toNodeKey: NodeKey<ToNodeType>;
    }, {
        message?: string | undefined;
        data?: Record<string, any> | undefined;
        layer: PreviousLayers | "NextjsCache";
        type: "Fatal" | "Normal" | "Warning";
        subtype: "NodeNotFound" | "UniqueIndexViolation" | "UniqueRelationshipViolation" | "LayerImplementationError";
    }>>;
    getRelatedTo: <FromNodeType_1 extends keyof E, RelationshipType_1 extends keyof E[FromNodeType_1] & R[number]["relationshipType"], ToNodeType_1 extends E[FromNodeType_1][RelationshipType_1] extends readonly any[] ? E[FromNodeType_1][RelationshipType_1][number] : never>(fromNodeKey: NodeKey<FromNodeType_1 & Capitalize<string>>, relationshipType: RelationshipType_1, toNodeType: ToNodeType_1) => Promise<Result<(R[number] & {
        relationshipType: RelationshipType_1;
    })["uniqueFromNode"] extends true ? NodeKey<ToNodeType_1> : NodeKey<ToNodeType_1>[], {
        message?: string | undefined;
        data?: Record<string, any> | undefined;
        layer: PreviousLayers | "NextjsCache";
        type: "Fatal" | "Normal" | "Warning";
        subtype: "NodeNotFound" | "UniqueIndexViolation" | "UniqueRelationshipViolation" | "LayerImplementationError";
    }>>;
    getNodeType: <NodeType extends N[number]["nodeType"]>(nodeType: NodeType) => Promise<Result<NodeKey<NodeType>[], {
        message?: string | undefined;
        data?: Record<string, any> | undefined;
        layer: PreviousLayers | "NextjsCache";
        type: "Fatal" | "Normal" | "Warning";
        subtype: "NodeNotFound" | "UniqueIndexViolation" | "UniqueRelationshipViolation" | "LayerImplementationError";
    }>>;
};

declare const defineReactCacheLayer: <N extends readonly {
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
})["stateDefinition"]>)[] | undefined; }, PreviousLayers extends Capitalize<string>>(graph: GraphLayer<N, R, E, UIdx, PreviousLayers>) => GraphLayer<N, R, E, UIdx, PreviousLayers | "ReactCache"> & {
    useNode: <T_1 extends N[number]["nodeType"], R_1 = UixNode<T_1, TypeOf<(N[number] & {
        nodeType: T_1;
    })["stateDefinition"]>>>(nodeType: T_1, nodeIndex: UIdx[T_1] extends string[] ? "nodeId" | UIdx[T_1][number] : "nodeId", indexKey: string, selector?: ((node: UixNode<T_1, TypeOf<(N[number] & {
        nodeType: T_1;
    })["stateDefinition"]>>) => R_1) | undefined) => _tanstack_react_query.UseQueryResult<R_1, Error>;
    useRelatedTo: <FromNodeType extends keyof E, RelationshipType extends keyof E[FromNodeType] & R[number]["relationshipType"], ToNodeType extends E[FromNodeType][RelationshipType] extends readonly any[] ? E[FromNodeType][RelationshipType][number] : never>(fromNodeKey: NodeKey<FromNodeType & Capitalize<string>>, relationshipType: RelationshipType, toNodeType: ToNodeType) => _tanstack_react_query.UseQueryResult<Promise<Result<(R[number] & {
        relationshipType: RelationshipType;
    })["uniqueFromNode"] extends true ? UixNode<ToNodeType, TypeOf<(N[number] & {
        nodeType: ToNodeType;
    })["stateDefinition"]>> : UixNode<ToNodeType, TypeOf<(N[number] & {
        nodeType: ToNodeType;
    })["stateDefinition"]>>[], {
        message?: string | undefined;
        data?: Record<string, any> | undefined;
        layer: PreviousLayers;
        type: "Fatal" | "Normal" | "Warning";
        subtype: "NodeNotFound" | "UniqueIndexViolation" | "UniqueRelationshipViolation" | "LayerImplementationError";
    }>>, Error>;
};

type GraphNodeType<G extends Pick<GraphLayer<any, any, any, any, any>, 'nodeDefinitions'>, T extends G extends Pick<GraphLayer<infer N extends {
    nodeType: string;
    stateDefinition: ZodObject<any>;
}[], any, any, any, any>, 'nodeDefinitions'> ? N[number]['nodeType'] : never> = UixNode<T, TypeOf<(G extends Pick<GraphLayer<infer N extends {
    nodeType: string;
    stateDefinition: ZodObject<any>;
}[], any, any, any, any>, 'nodeDefinitions'> ? (N[number] & {
    nodeType: T;
})['stateDefinition'] : never)>>;

export { Err, type GraphLayer, type GraphNodeType, type NodeKey, Ok, type OmitNodeConstants, type Result, type UixNode, defineBaseGraph, defineNeo4jLayer, defineNextjsCacheLayer, defineNode, defineReactCacheLayer };
