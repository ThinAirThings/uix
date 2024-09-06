import { useQuery } from "@tanstack/react-query"
import { createContext, ReactNode, useContext, useEffect, useState, useTransition } from "react"
import { AnyErrType, Err, Ok, Result } from "../../types/Result"
import { useStaticOperation } from "./useStaticOperation"
import { Text } from "ink"
import React from "react"
import Spinner from "ink-spinner"
import { applicationStorev2 } from "./applicationStorev2"
import { Loading } from "../(components)/Loading"
import { Success } from "../(components)/Successv2"



const UixConfigContext = createContext<{
    config: string
}>({
    config: ''
})

export const useUixConfigContext = () => useContext(UixConfigContext)
export const UixConfigProvider = ({children}:{children: ReactNode}) => {
    const data = useStaticOperation({
        dependencies: ['hello'],
        tryOp: async ([thing]) => {
            await new Promise((resolve) => setTimeout(resolve, 1000))
            return 'data'
        },
        // Throw from tryOp and use instanceOf checks to type
        catchOp: (error) => Err({
            type: 'UixConfigProvider',
            subtype: 'Error',
            message: error.message
        }),
        finallyOp: () => {
            applicationStorev2.setState(state => {
                state.complete = true
            })
        },
        render: {
            Success: ({data}) => <Success><Text>data output {data}</Text></Success>,
            Error: ({error}) => <Text>{error.message}</Text>,
            Pending: () => <Loading text="Loading config..." />
        }
    })
    if (!data) return null
    return (
        <UixConfigContext.Provider value={{config: data}}>
            {children}
        </UixConfigContext.Provider>
    )
}

