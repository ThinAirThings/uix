import { FC } from "react"
import { ErrType, Result, tryCatch } from "../../types/Result"
import { skipToken, useQuery } from "@tanstack/react-query"
import { Box } from "ink"
import React from 'react'

type Strictify<T extends readonly any[]> = { [K in keyof T]-?: T[K] & {} }
export const Operation = <
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
    dependencies,
    render
}: {
    operationKey: OperationKey
    tryOp: (dependencies: Strictify<Dependencies>) => Promise<T> | T,
    catchOp: (error: any, dependencies: Strictify<Dependencies>) => Result<never, ErrType<ErrorType, ErrorSubtype, ErrorData>>,
    finallyOp?: (dependencies: Strictify<Dependencies>) => void,
    dependencies: Dependencies
    render: {
        Success: FC<{ data: T, dependencies: Strictify<Dependencies> }>
        Pending: FC<{ dependencies: Strictify<Dependencies> }>
        Error: FC<{ error: ErrType<ErrorType, ErrorSubtype, ErrorData>, dependencies: Strictify<Dependencies> }>
    }
}) => {
    const { data: result } = useQuery({
        queryKey: [operationKey],
        queryFn: dependencies.length === 0
            ? async () => {
                const result = await tryCatch({
                    try: () => tryOp(dependencies as Strictify<Dependencies>),
                    catch: (error) => catchOp(error, dependencies as Strictify<Dependencies>),
                    finally: () => finallyOp?.(dependencies as Strictify<Dependencies>)
                })
                return result
            }
            : dependencies.every(dependency => (!!dependency))
                ? async () => {
                    const result = await tryCatch({
                        try: () => tryOp(dependencies as Strictify<Dependencies>),
                        catch: (error) => catchOp(error, dependencies as Strictify<Dependencies>),
                        finally: () => finallyOp?.(dependencies as Strictify<Dependencies>)
                    })
                    return result
                }
                : skipToken
    })
    return (
        <Box flexDirection="column">
            {!result ? <render.Pending dependencies={dependencies as Strictify<Dependencies>} />
                : result.error ? <render.Error error={result.error} dependencies={dependencies as Strictify<Dependencies>} />
                    : <render.Success data={result.data} dependencies={dependencies as Strictify<Dependencies>} />
            }
        </Box>
    )
}