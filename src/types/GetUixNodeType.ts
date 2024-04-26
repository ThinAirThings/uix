import { TypeOf, ZodObject } from "zod";
import { GraphLayer } from "./Graph";
import { UixNode } from "./UixNode";


export type GetUixNodeType<
    G extends GraphLayer<any, any, any, any, any>,
    T extends G extends GraphLayer<infer N extends { nodeType: string, stateDefinition: ZodObject<any> }[], any, any, any, any>
    ? N[number]['nodeType']
    : never
> = UixNode<T, TypeOf<
    (G extends GraphLayer<infer N extends { nodeType: string, stateDefinition: ZodObject<any> }[], any, any, any, any>
        ? (N[number] & { nodeType: T })['stateDefinition']
        : never
    )
>>


// const neo4jLayer = Neo4jLayer(testGraph, {

// } as any)


// type NodeType = GetUixNodeType<typeof neo4jLayer, 'User'>