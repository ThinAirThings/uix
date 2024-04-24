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

type NodeKey<T extends Capitalize<string>> = {
    nodeType: T;
    nodeId: string;
};

type OmitNodeContants<T extends UixNode<any, any>> = Omit<T, 'nodeType' | 'nodeId' | 'createdAt' | 'updatedAt'>;
declare const defineGraph: <N extends readonly {
    nodeType: any;
    stateDefinition: any;
}[], R extends { [K in N[number]["nodeType"]]?: {
    [R: Uppercase<string>]: {
        toNodeType: readonly N[number]["nodeType"][];
        stateDefinition?: ZodObject<any>;
    };
}; }>({ nodeDefinitions, relationshipDefinitions }: {
    nodeDefinitions: N;
    relationshipDefinitions: R;
}) => {
    nodeDefinitions: N;
    relationshipDefinitions: R;
    createNode: <T extends N[number]["nodeType"]>(nodeType: T, initialState: TypeOf<(N[number] & {
        nodeType: T;
    })['stateDefinition']>) => Promise<UixNode<T, TypeOf<(N[number] & {
        nodeType: T;
    })['stateDefinition']>>>;
    getNode: <T_1 extends N[number]["nodeType"]>({ nodeType, nodeId }: NodeKey<T_1>) => UixNode<T_1, TypeOf<(N[number] & {
        nodeType: T_1;
    })["stateDefinition"]>>;
    updateNode: <T_2 extends N[number]["nodeType"]>({ nodeType, nodeId }: NodeKey<T_2>, state: Partial<TypeOf<(N[number] & {
        nodeType: T_2;
    })["stateDefinition"]>>) => UixNode<T_2, TypeOf<(N[number] & {
        nodeType: T_2;
    })["stateDefinition"]>>;
};

declare const defineNode: <T extends Capitalize<string>, SD extends ZodObject<any, zod.UnknownKeysParam, zod.ZodTypeAny, {
    [x: string]: any;
}, {
    [x: string]: any;
}>>(nodeType: T, stateDefinition: SD) => {
    nodeType: T;
    stateDefinition: SD;
};

declare const Neo4jLayer: <G extends {
    nodeDefinitions: any;
    relationshipDefinitions: any;
    createNode: <T extends any>(nodeType: T, initialState: any) => Promise<UixNode<T, any>>;
    getNode: <T_1 extends any>({ nodeType, nodeId }: NodeKey<T_1>) => UixNode<T_1, any>;
    updateNode: <T_2 extends any>({ nodeType, nodeId }: NodeKey<T_2>, state: Partial<any>) => UixNode<T_2, any>;
}, UIdx extends { [T_3 in G["nodeDefinitions"][number]["nodeType"]]?: readonly (keyof TypeOf<(G["nodeDefinitions"][number] & {
    nodeType: T_3;
})["stateDefinition"]>)[]; }>(graph: G, config: {
    connection: {
        uri: string;
        user: string;
        password: string;
    };
    uniqueIndexes: UIdx;
}) => {
    uniqueIndexes: UIdx;
    nodeDefinitions: any;
    relationshipDefinitions: any;
    createNode: <T_4 extends G["nodeDefinitions"][number]["nodeType"]>(nodeType: T_4, initialState: TypeOf<(G["nodeDefinitions"][number] & {
        nodeType: T_4;
    })["stateDefinition"]>) => Promise<UixNode<T_4, any>>;
    getNode: <T_5 extends G["nodeDefinitions"][number]["nodeType"]>(nodeType: T_5, nodeIndex: T_5 extends keyof UIdx ? UIdx[T_5] extends string[] ? "nodeId" | UIdx[T_5][number] : "nodeId" : "nodeId", indexKey: string) => Promise<UixNode<T_5, TypeOf<(G["nodeDefinitions"][number] & {
        nodeType: T_5;
    })["stateDefinition"]>>>;
    updateNode: <T_6 extends G["nodeDefinitions"][number]["nodeType"]>({ nodeType, nodeId }: NodeKey<T_6>, state: Partial<TypeOf<(G["nodeDefinitions"][number] & {
        nodeType: T_6;
    })["stateDefinition"]>>) => Promise<any>;
    createRelationship: <FNT extends G["nodeDefinitions"][number]["nodeType"], RT extends keyof G["relationshipDefinitions"][FNT]>(fromNode: NodeKey<FNT>, relationshipType: RT, toNode: NodeKey<G['relationshipDefinitions'][FNT][RT]['toNodeType'][number]>, ...[state]: (G['relationshipDefinitions'][FNT][RT])['stateDefinition'] extends ZodObject<ZodRawShape> ? [TypeOf<(G['relationshipDefinitions'][FNT][RT])['stateDefinition']>] : [
    ]) => Promise<{
        fromNode: any;
        toNode: any;
    }>;
    getRelatedTo: <FNT_1 extends G["nodeDefinitions"][number]["nodeType"], RT_1 extends keyof G["relationshipDefinitions"][FNT_1], TNT extends G["relationshipDefinitions"][FNT_1][RT_1]["toNodeType"][number]>(fromNode: NodeKey<FNT_1>, relationshipType: RT_1, toNodeType: TNT) => Promise<UixNode<TNT, TypeOf<(G["nodeDefinitions"][number] & {
        nodeType: TNT;
    })["stateDefinition"]>>[]>;
};

declare const NextjsCacheLayer: <G extends {
    uniqueIndexes: any;
    nodeDefinitions: any;
    relationshipDefinitions: any;
    createNode: <T extends any>(nodeType: T, initialState: any) => Promise<UixNode<T, any>>;
    getNode: <T_1 extends any>(nodeType: T_1, nodeIndex: T_1 extends string | number | symbol ? any : "nodeId", indexKey: string) => Promise<UixNode<T_1, any>>;
    updateNode: <T_2 extends any>({ nodeType, nodeId }: NodeKey<T_2>, state: Partial<any>) => Promise<any>;
    createRelationship: <FNT extends any, RT extends string | number | symbol>(fromNode: NodeKey<FNT>, relationshipType: RT, toNode: NodeKey<any>, ...[state]: [] | [any]) => Promise<{
        fromNode: any;
        toNode: any;
    }>;
    getRelatedTo: <FNT_1 extends any, RT_1 extends string | number | symbol, TNT extends any>(fromNode: NodeKey<FNT_1>, relationshipType: RT_1, toNodeType: TNT) => Promise<UixNode<TNT, any>[]>;
}>(graph: G) => Pick<G, 'getNode' | 'updateNode'>;

export { Neo4jLayer, NextjsCacheLayer, type OmitNodeContants, defineGraph, defineNode };
