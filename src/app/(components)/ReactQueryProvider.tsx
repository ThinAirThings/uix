
import React, { FC, ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()
export const ReactQueryProvider: FC<{
    CommandEnvironment: FC
}> = ({
    CommandEnvironment
}) => {
        return (
            <QueryClientProvider client={queryClient}>
                <CommandEnvironment />
            </QueryClientProvider>
        )
    }
