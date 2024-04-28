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
    })['stateDefinition']>) => Promise<Result<NodeKey<T>, ReturnType<ReturnType<typeof ExtendUixError<LayerStack>>>>>;
    getNode: <T extends N[number]['nodeType']>(nodeType: T, nodeIndex: UIdx[T] extends string[] ? UIdx[T][number] | 'nodeId' : 'nodeId', indexKey: string) => Promise<Result<UixNode<T, TypeOf<(N[number] & {
        nodeType: T;
    })['stateDefinition']>>, ReturnType<ReturnType<typeof ExtendUixError<LayerStack>>>>>;
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
    getRelatedTo: <FromNodeType extends keyof E, RelationshipType extends ((keyof E[FromNodeType]) & R[number]['relationshipType']), ToNodeType extends E[FromNodeType][RelationshipType] extends readonly any[] ? E[FromNodeType][RelationshipType][number] : never>(fromNode: NodeKey<FromNodeType & Capitalize<string>>, relationshipType: RelationshipType, toNodeType: ToNodeType) => Promise<Result<UixNode<ToNodeType, TypeOf<(N[number] & {
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
})["stateDefinition"]>)[] | undefined; }, PreviousLayers extends Capitalize<string>>(graph: GraphLayer<N, R, E, UIdx, PreviousLayers>) => GraphLayer<N, R, E, UIdx, PreviousLayers | 'NextjsCache'>;

type GraphNodeType<G extends Pick<GraphLayer<any, any, any, any, any>, 'nodeDefinitions'>, T extends G extends Pick<GraphLayer<infer N extends {
    nodeType: string;
    stateDefinition: ZodObject<any>;
}[], any, any, any, any>, 'nodeDefinitions'> ? N[number]['nodeType'] : never> = UixNode<T, TypeOf<(G extends Pick<GraphLayer<infer N extends {
    nodeType: string;
    stateDefinition: ZodObject<any>;
}[], any, any, any, any>, 'nodeDefinitions'> ? (N[number] & {
    nodeType: T;
})['stateDefinition'] : never)>>;

export { type GraphLayer, type GraphNodeType, type NodeKey, type OmitNodeConstants, type UixNode, defineBaseGraph, defineNeo4jLayer, defineNextjsCacheLayer, defineNode };
