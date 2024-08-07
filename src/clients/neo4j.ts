import neo4j, { Driver } from 'neo4j-driver';
import { Neo4jError } from "neo4j-driver"
import { AnyErrType, Err, ErrType, Result } from '../types/Result';
import { Action } from '../types/Action';


export const createNeo4jClient = (config: {
    uri: string
    username: string
    password: string,
}, options?: Parameters<typeof neo4j.driver>[2]) => {
    return neo4j.driver(
        config.uri,
        neo4j.auth.basic(config.username, config.password),
        { ...options, disableLosslessIntegers: true }
    )
}


export const Neo4jErr = (
    error: Neo4jError,
) => Err({
    type: 'Neo4jErr',
    subtype: Neo4jErrorSubtype.UNKNOWN,
    message: error.message,
    data: JSON.parse(JSON.stringify({
        ...error
    }))
})

export enum Neo4jErrorSubtype {
    UNKNOWN = 'UNKNOWN',
}

let _neo4jDriver: Driver | null = null
export const neo4jDriver = () => {
    if (_neo4jDriver) return _neo4jDriver
    _neo4jDriver = createNeo4jClient({
        uri: process.env.NEO4J_URI!,
        username: process.env.NEO4J_USERNAME!,
        password: process.env.NEO4J_PASSWORD!
    }, { disableLosslessIntegers: true })
    return _neo4jDriver
}

export const neo4jAction = <
    Input extends any[],
    T,
    PrevErrType extends AnyErrType,
>(
    fn: Action<Input, T, PrevErrType>
) => async (
    ...args: Input
): Promise<
    Result<T,
        | PrevErrType
        | ErrType<'Neo4jErr', Neo4jErrorSubtype.UNKNOWN, Neo4jError>
    >
> => {
        try {
            return await fn(...args)
        } catch (e) {
            if (!(e instanceof Neo4jError)) throw e
            return Neo4jErr(
                e
            )
        }
    }
