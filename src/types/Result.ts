import { Neo4jError } from "neo4j-driver"

//  ___             _ _   
// | _ \___ ____  _| | |_ 
// |   / -_|_-< || | |  _|
// |_|_\___/__/\_,_|_|\__|
export type AnyResult = Result<any, any>
export type Result<T, E extends AnyErrType> = {
    data: T
    error: null
} | {
    data: null
    error: E
}

//  _____          ___      _      _    
// |_   _| _ _  _ / __|__ _| |_ __| |_  
//   | || '_| || | (__/ _` |  _/ _| ' \ 
//   |_||_|  \_, |\___\__,_|\__\__|_||_|
//           |__/                       
export const tryCatch = async <
    T,
    ErrorType extends string,
    ErrorSubtype extends string,
    ErrorInfo extends Record<string, any> | undefined = undefined,
>(opts: {
    try: () => Promise<T> | T,
    catch: (error: any) => Result<never, ErrType<ErrorType, ErrorSubtype, ErrorInfo>>,
    finally?: () => void
}): Promise<Result<T, ErrType<ErrorType, ErrorSubtype, ErrorInfo>>> => {
    try {
        return Ok(await opts.try())
    } catch (error) {
        return opts.catch(error)
    } finally {
        opts.finally?.()
    }
}

//  ___  _   
// / _ \| |__
// | (_) | / /
// \___/|_\_\
export const Ok = <T>(data: T): Result<T, never> => ({
    data,
    error: null,
})


export type AnyErrType = ErrType<any, any, any>
export type ErrType<
    Type extends string,
    Subtype extends string,
    Data extends Record<string, any> | undefined = undefined,
> = {
    type: Type
    subtype: Subtype
    message: string
    data: Data
}

//  ___         
// | __|_ _ _ _ 
// | _|| '_| '_|
// |___|_| |_|  

export const Err = <
    Type extends string,
    Subtype extends string,
    Data extends Record<string, any> | undefined = undefined,
>({
    type,
    subtype,
    message,
    data
}: {
    type: Type,
    subtype: Subtype,
    message: string,
    data?: Data
}): Result<never, ErrType<Type, Subtype, Data>> => {
    console.error({ type, subtype, message, ...data })

    return {
        data: null,
        error: {
            type,
            subtype,
            message,
            data: data as Data
        }
    }
}

type UixErrSubtype = 'CLIError' | 'ExpectedRuntimeError'
export const UixErr = <
    Subtype extends UixErrSubtype,
    Data extends Record<string, any> | undefined = undefined,
>({
    subtype,
    message,
    data
}: {
    subtype: Subtype
    message: string
    data?: Data
}) => Err({
    type: 'UixErr',
    subtype,
    message,
    data: data as Data extends Record<string, any> ? Data : undefined
})


export type AnyQueryError = QueryError<any>
export class QueryError<
    ErrType extends AnyErrType
> extends Error {
    type: ErrType['type']
    subtype: ErrType['subtype']
    data: ErrType['data']
    constructor(
        err: ErrType
    ) {
        super(err.message)
        this.type = err.type
        this.subtype = err.subtype
        this.data = err.data
    }
}


