import { TypeOf, ZodObject } from "zod";
import { GraphLayer } from "./Graph";
import { UixNode } from "./UixNode";
import { testGraph } from "@/tests/testGraph";


export type GetUixNodeType<
    G extends Pick<GraphLayer<any, any, any, any, any>, 'nodeDefinitions'>,
    T extends G extends Pick<GraphLayer<infer N extends { nodeType: string, stateDefinition: ZodObject<any> }[], any, any, any, any>, 'nodeDefinitions'>
    ? N[number]['nodeType']
    : never
> = UixNode<T, TypeOf<
    (G extends Pick<GraphLayer<infer N extends { nodeType: string, stateDefinition: ZodObject<any> }[], any, any, any, any>, 'nodeDefinitions'>
        ? (N[number] & { nodeType: T })['stateDefinition']
        : never
    )
>>


// const neo4jLayer = Neo4jLayer(testGraph, {

// } as any)


// type NodeType = GetUixNodeType<typeof testGraph, 'User'>