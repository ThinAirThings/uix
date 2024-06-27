
import React, { FC, useState, useEffect } from 'react';
import { ReactQueryProvider } from './ReactQueryProvider';
import dotenv from 'dotenv'
import { Box } from 'ink';

export const CommandEnvironment: FC<{
    envPath: string
    Command: FC<any>
}> = ({
    envPath,
    Command
}) => {
        const [envLoaded, setEnvLoaded] = useState(false)
        useEffect(() => {
            dotenv.config({ path: envPath })
            setEnvLoaded(true)
        }, [])
        if (!envLoaded) return
        return (
            <Box>
                <ReactQueryProvider>
                    <Command />
                </ReactQueryProvider>
            </Box>
        )
    }