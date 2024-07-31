import { createImmerState } from "../(utilities)/createImmerState";
import React, { FC } from 'react'
import { GenericUixConfig } from "../../config/defineConfig";
import { Driver } from "neo4j-driver";
import { createNeo4jClient } from "../../clients/neo4j";
import { Box, Newline, Text } from "ink";
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';
import { Error } from "../(components)/Error";
import { UixErr } from "../../types/Result";

export const applicationStore = createImmerState({
    outputMap: new Map<string, {
        Component: FC,
    }>([['header', {
        Component: () => (
            <Box flexDirection="column">
                <Gradient name='rainbow'>
                    <BigText text='Uix' font='3d' />
                </Gradient>
                <Text>Uix Graph System 🔥 by 🐰 Thin Air </Text>
                <Newline />
            </Box>
        ),
    }]]),
    pendingSet: new Set<string>(),
    uixConfig: null as GenericUixConfig | null,
    complete: false as boolean,
    neo4jDriver: null as Driver | null,
    timeout: (() => {
        setTimeout(async () => {
            applicationStore.setState(state => {
                state.pendingSet.clear()
                state.outputMap.set('timeout', {
                    Component: () => <Error message="Operation timed out" error={UixErr({
                        subtype: 'CLIError',
                        message: 'System timeout. Check your database connection!',
                    }).error!} />
                })
            })
            await applicationStore.getState().neo4jDriver?.close()
        }, 15 * 1000)
    })(),
})

applicationStore.subscribe(
    state => state.uixConfig,
    async uixConfig => {
        if (!uixConfig) return
        const neo4jDriver = createNeo4jClient({
            uri: process.env.NEO4J_URI!,
            username: process.env.NEO4J_USERNAME!,
            password: process.env.NEO4J_PASSWORD!,
        }, {
            connectionTimeout: 3000,
        })
        applicationStore.setState({
            neo4jDriver: neo4jDriver
        })
    }
)
// Close the neo4j driver when all operations are successful
applicationStore.subscribe(
    state => state.pendingSet,
    async pendingSet => {
        if (pendingSet.size > 0) return
        await new Promise(resolve => setTimeout(resolve, 1000))
        await applicationStore.getState().neo4jDriver?.close()
        process.exit(0)
    }
)

export const useApplicationStore = <R,>(
    selector: (state: ReturnType<typeof applicationStore.getState>) => R
) => applicationStore(selector)