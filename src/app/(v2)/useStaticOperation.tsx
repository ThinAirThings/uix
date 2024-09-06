import { FC, useEffect, useId, useState } from "react"
import { AnyErrType, ErrType, Result, tryCatch } from "../../types/Result"
import { applicationStorev2 } from "./applicationStorev2"
import React from "react"
import { stat } from "fs"

export type ReactiveResult<T, E extends AnyErrType> = {
    data: T
    error: null
    isPending: false
} | {
    data: null
    error: E
    isPending: false
} | {
    data: null
    error: null
    isPending: true
}
export const useStaticOperation = <
    T, 
    E extends AnyErrType,
    Dependencies extends readonly any[] | readonly [] = readonly [],
>({
    
    dependencies = [] as const as Dependencies,
    tryOp,
    catchOp,
    finallyOp,
    render
}:{
    dependencies?: Dependencies
    tryOp: (dependencies: Dependencies) =>Promise<T> | T,
    catchOp: (error: Error, dependencies: Dependencies) => Result<never, E>,
    finallyOp?: (dependencies: Dependencies) => void,
    render: {
        Success: FC<{ data: T, dependencies: Dependencies }>
        Error: FC<{ error: E, dependencies: Dependencies }>
        Pending: FC<{dependencies: Dependencies}>
    }
}) => {
    const operationId = useId()
    const [data, setData] = useState<T | null>(null)
    const [error, setError] = useState<E | null>(null)
    const [isPending, setIsPending] = useState(true)
    useEffect(() => {
       (async () => {
            if (dependencies && !(dependencies.every(dependency => !!dependency))) return
            const {data, error} = await tryCatch({
                try: () => tryOp(dependencies),
                catch: (error) => catchOp(error, dependencies),
                finally: () => {
                    setIsPending(false)
                    finallyOp?.(dependencies)
                }
            })
            if (error) {
                setError(error as E)
            } else {
                setData(data)
            }
        })()
    }, dependencies)
    useEffect(() => {
        if (isPending) {
            applicationStorev2.setState(state => {
                state.pendingComponentMap.set(operationId, {
                    Component: () => <render.Pending dependencies={dependencies}/> ,
                })
            })
        } 
        if (error) {
            applicationStorev2.setState(state => {
                state.pendingComponentMap.delete(operationId)
                state.staticComponentMap.set(operationId, {
                    Component: () => <render.Error error={error} dependencies={dependencies}/>,
                })
            })
        }
        if (data) {
            applicationStorev2.setState(state => {
                state.pendingComponentMap.delete(operationId)
                state.staticComponentMap.set(operationId, {
                    Component: () => <render.Success data={data} dependencies={dependencies}/>,
                })
            })
        }
    }, [isPending, error, data])
    return data
}