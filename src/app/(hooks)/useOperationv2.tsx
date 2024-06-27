import { skipToken, useQuery } from "@tanstack/react-query"
import { ErrType, Result, tryCatch } from "../../types/Result"


type Strictify<T extends readonly any[]> = { [K in keyof T]-?: T[K] & {} }
export const useOperationv2 = <
    OperationKey extends string,
    T,
    ErrorType extends string,
    ErrorSubtype extends string,
    ErrorData extends Record<string, any> | undefined,
    Dependencies extends readonly any[]
>({
    operationKey,
    tryOp,
    catchOp,
    finallyOp,
    dependencies
}: {
    operationKey: OperationKey
    tryOp: (dependencies: Strictify<Dependencies>) => Promise<T> | T,
    catchOp: (error: any, dependencies: Strictify<Dependencies>) => Result<never, ErrType<ErrorType, ErrorSubtype, ErrorData>>,
    finallyOp?: (dependencies: Strictify<Dependencies>) => void,
    dependencies: Dependencies
}) => {
    const { data, error } = useQuery({
        queryKey: [operationKey],
        queryFn: dependencies.length === 0
            ? async () => {
                const { data, error } = await tryCatch({
                    try: () => tryOp(dependencies as Strictify<Dependencies>),
                    catch: (error) => catchOp(error, dependencies as Strictify<Dependencies>),
                    finally: () => finallyOp?.(dependencies as Strictify<Dependencies>)
                })
                if (error) throw new Error(error.message)
                return data
            }
            : dependencies.every(dependency => (!!dependency))
                ? async () => {
                    const { data, error } = await tryCatch({
                        try: () => tryOp(dependencies as Strictify<Dependencies>),
                        catch: (error) => catchOp(error, dependencies as Strictify<Dependencies>),
                        finally: () => finallyOp?.(dependencies as Strictify<Dependencies>)
                    })
                    if (error) throw new Error(error.message)
                    return data
                }
                : skipToken
    })
    return { data, error }
}