import { TypeOf, ZodTypeAny, z } from "zod";
import neo4j, { Config, Driver, EagerResult, Integer, Neo4jError, Node, Relationship } from 'neo4j-driver';
import { createUniqueIndex } from "../layers/Neo4j/createUniqueIndex";
import { UixNode } from "../types/UixNode";
import { Err, Ok, Result } from "../types/Result";
import { ExtendUixError } from "./UixErr";
import { GraphLayer } from "../types/GraphLayer";



export class LayerDefinition<
    T extends Capitalize<string>,
    ConfigurationDefinition extends ZodTypeAny | undefined = undefined,
    Dependencies extends Record<string, any> | undefined = undefined
> {
    private static build = (graph: GraphLayer) => graph
    private static wrap = <
        T extends Capitalize<string>,
        ConfigurationDefinition extends ZodTypeAny | undefined = undefined,
        Dependencies extends Record<string, any> | undefined = undefined
    >(definition: LayerDefinition<T, ConfigurationDefinition, Dependencies>) => Object.assign(LayerDefinition.build, {
        ...definition
    })
    layerType: T
    configurationDefinition: ConfigurationDefinition
    private _initializer: (graph: GraphLayer, ...[config]: ConfigurationDefinition extends ZodTypeAny ? [TypeOf<ConfigurationDefinition>] : []) => Dependencies
    constructor(layerType: T, options?: {
        configurationDefinition?: ConfigurationDefinition,
        initializer?: (graph: GraphLayer, ...[config]: ConfigurationDefinition extends ZodTypeAny ? [TypeOf<ConfigurationDefinition>] : []) => Dependencies
    }) {
        this.layerType = layerType
        this.configurationDefinition = options?.configurationDefinition ?? undefined as ConfigurationDefinition
        this._initializer = options?.initializer ?? (() => ({}) as Dependencies)
    }
    configuration = <
        ConfigurationDefinition extends ZodTypeAny
    >(
        configurationDefinition: ConfigurationDefinition
    ) => LayerDefinition.wrap(new LayerDefinition<T, ConfigurationDefinition, Dependencies>(this.layerType, {
        configurationDefinition,
    }))
    initializer = <
        Dependencies extends Record<string, any>
    >(
        initializer: (graph: GraphLayer, ...[config]: ConfigurationDefinition extends ZodTypeAny ? [TypeOf<ConfigurationDefinition>] : []) => Dependencies
    ) => LayerDefinition.wrap(new LayerDefinition<T, ConfigurationDefinition, Dependencies>(this.layerType, {
        configurationDefinition: this.configurationDefinition,
        initializer
    }))
    createNode = (fn: (
        graph: GraphLayer,
        UixErr: ReturnType<typeof ExtendUixError>,
        nodeType: Capitalize<string>,
        initialState: Record<string, any>,
        ...[dependencyInjection]: Dependencies extends NonNullable<unknown> ? [Dependencies] : []
    ) => Promise<Result<
        UixNode<any, any>,
        ReturnType<ReturnType<typeof ExtendUixError>>
    >>) => LayerDefinition.wrap(new LayerDefinition<T, ConfigurationDefinition, Dependencies>(this.layerType, {
        configurationDefinition: this.configurationDefinition,
        initializer: this._initializer
    }))
}

export const defineLayer = <
    T extends Capitalize<string>,
    Configuration extends ZodTypeAny | undefined = undefined,
    R extends Record<string, any> | undefined = undefined
>(
    layerType: T
) => new LayerDefinition<T, Configuration, R>(layerType)

const Neo4jLayer = defineLayer('Neo4j')
    .configuration(z.object({
        url: z.string(),
        username: z.string(),
        password: z.string()
    }))
    .initializer((graph, config) => {
        const neo4jDriver = neo4j.driver(config.url, neo4j.auth.basic(
            config.username,
            config.password
        ))
        const uniqueIndexes = graph.uniqueIndexes
        // Create Unique Indexes
        const uniqueIndexesCreated = [
            ...graph.nodeDefinitions.map(async ({ nodeType }) => createUniqueIndex(neo4jDriver, nodeType, 'nodeId')),
            ...(uniqueIndexes && (Object.entries(uniqueIndexes)).map(async ([nodeType, _indexes]) => {
                const indexes = _indexes as string[]
                return await Promise.all(indexes.map(async (index) => await createUniqueIndex(neo4jDriver, nodeType as string, index as string)))
            })) ?? []
        ]
        return {
            uniqueIndexesCreated,
            driver: neo4j.driver(config.url, neo4j.auth.basic(config.username, config.password))
        }
    })
    .createNode(async (graph, UixErr, nodeType, initialState, { driver, uniqueIndexesCreated }) => {
        await Promise.all(uniqueIndexesCreated)
        const newNode = await graph.createNode(nodeType, initialState) //as unknown as UixNode<typeof nodeType, TypeOf<(N[number] & { nodeType: typeof nodeType })['stateDefinition']>>
        if (!driver) throw new Error('Neo4jNode.neo4jDriver is not configured')
        return await driver.executeQuery<EagerResult<{
            node: Node<Integer, UixNode<typeof nodeType, any>>
        }>>(`
                CREATE (node:${nodeType} $newNode)
                RETURN node
            `, { newNode: newNode.ok ? newNode.val : {} })
            .then(({ records }) => Ok(records.map(record => record.get('node').properties)[0]))
            .catch((e: Neo4jError) => e.message === 'Neo.ClientError.Schema.ConstraintValidationFailed'
                ? Err(UixErr('Normal', 'UniqueIndexViolation', { message: e.message }))
                : Err(UixErr('Fatal', 'LayerImplementationError', { message: e.message }))
            )
    })

const res = Neo4jLayer()
// export const defineLayer = <
//     T extends Capitalize<string>,
//     Configuration extends ZodTypeAny | undefined = undefined,
//     R extends unknown | undefined = undefined
// >(...[layerType, config]:
//     | [
//         layerType: T,
//         initialization: (graph: GraphLayer, config: Configuration) => R,
//         fns?: {
//             createNode: (
//                 nodeType: Capitalize<string>,
//                 initialState: any,
//                 graph: GraphLayer,
//                 UixErr: ReturnType<typeof ExtendUixError>,
//                 ...[dependencyInjection]: R extends NonNullable<unknown> ? [R] : []
//             ) => Promise<Result<
//                 UixNode<any, any>,
//                 ReturnType<ReturnType<typeof ExtendUixError>>
//             >>
//         }]
// ) => <
//     G extends GraphLayer
// >(
//     graph: G,
//     ...[configuration]: Configuration extends ZodTypeAny ? [TypeOf<Configuration>] : [],
// ) => {
//         type TypeArgs = G extends GraphLayer<infer N, infer R, infer E, infer UIdx>
//             ? {
//                 nodeDefinitions: N,
//                 relationshipDefinitions: R,
//                 edgeDefinitions: E,
//                 uniqueIndexes: UIdx
//             }
//             : never
//         const dependencies = options?.initialization(configuration, graph)
//         return {
//             createNode: <
//                 T extends TypeArgs['nodeDefinitions'][number]['nodeType']
//             >(
//                 nodeType: T,
//                 initialState: TypeOf<(TypeArgs['nodeDefinitions'][number] & { nodeType: T })['stateDefinition']>
//             ) => options?.fns.createNode(graph, ExtendUixError(), dependencies, nodeType, initialState)
//         }
//     }

// type Entries<T> = {
//     [K in keyof T]: [K, T[K]];
// }[keyof T][];

// const Neo4jLayer = defineLayer('Neo4j', {
//     input: z.object({
//         url: z.string(),
//         username: z.string(),
//         password: z.string()
//     }),
//     initialization: (graph, configuration) => {
//         const neo4jDriver = neo4j.driver(configuration.url, neo4j.auth.basic(
//             configuration.username,
//             configuration.password
//         ))
//         const uniqueIndexes = graph.uniqueIndexes
//         // Create Unique Indexes
//         const uniqueIndexesCreated = [
//             ...graph.nodeDefinitions.map(async ({ nodeType }) => createUniqueIndex(neo4jDriver, nodeType, 'nodeId')),
//             ...(uniqueIndexes && (Object.entries(uniqueIndexes) as Entries<typeof uniqueIndexes>).map(async ([nodeType, _indexes]) => {
//                 const indexes = _indexes as string[]
//                 return await Promise.all(indexes.map(async (index) => await createUniqueIndex(neo4jDriver, nodeType as string, index as string)))
//             })) ?? []
//         ]
//         return {
//             uniqueIndexesCreated,
//             driver: neo4j.driver(configuration.url, neo4j.auth.basic(configuration.username, configuration.password))
//         }
//     },
// }, {
//     createNode: async (nodeType, initialState, graph, UixErr,) => {
//         await Promise.all(uniqueIndexesCreated)
//         const newNode = await graph.createNode(nodeType, initialState) //as unknown as UixNode<typeof nodeType, TypeOf<(N[number] & { nodeType: typeof nodeType })['stateDefinition']>>
//         if (!driver) throw new Error('Neo4jNode.neo4jDriver is not configured')
//         return await driver.executeQuery<EagerResult<{
//             node: Node<Integer, UixNode<typeof nodeType, any>>
//         }>>(`
//                 CREATE (node:${nodeType} $newNode)
//                 RETURN node
//             `, { newNode: newNode.ok ? newNode.val : {} })
//             .then(({ records }) => Ok(records.map(record => record.get('node').properties)[0]))
//             .catch((e: Neo4jError) => e.message === 'Neo.ClientError.Schema.ConstraintValidationFailed'
//                 ? Err(UixErr('Normal', 'UniqueIndexViolation', { message: e.message }))
//                 : Err(UixErr('Fatal', 'LayerImplementationError', { message: e.message }))
//             )
//     }
// }
// )