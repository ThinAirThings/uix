
import React, { FC } from 'react';
import { ReactQueryProvider } from './ReactQueryProvider';
import dotenv from 'dotenv'
import { Box, Text } from 'ink';
import { useOperation } from '../(hooks)/useOperation';
import { GenericUixConfig, GenericUixConfigDefinition, GenericUixConfigWithoutPath } from '../../config/defineConfig';
import { applicationStore } from '../(stores)/applicationStore';
import { UixErr, UixErrSubtype } from '../../types/Result';
import { Loading } from './Loading';
import { bundleNRequire } from 'bundle-n-require'
import { findConfig } from '../../utilities/findConfig';
import { GraphType } from '../../types/GraphType';
import path from 'path';
export const CommandEnvironment: FC<{
    relativePathToConfig?: string
    Command: FC<any>
}> = ({
    relativePathToConfig,
    Command
}) => {
        return (
            <Box>
                <ReactQueryProvider
                    CommandEnvironment={() => {
                        // Get config
                        const result = useOperation({
                            dependencies: [],
                            operationKey: 'uixConfig',
                            tryOp: async () => {
                                const pathToConfig = findConfig({ relativePathToConfig })
                                const { mod } = await bundleNRequire(pathToConfig, {
                                    interopDefault: true
                                })
                                const uixConfigDefinition = mod?.default ?? mod as GenericUixConfigDefinition
                                const uixConfig = ({
                                    outdir: path.resolve(uixConfigDefinition.outdir ?? path.join('uix', 'generated')),
                                    graph: new GraphType(uixConfigDefinition.type, uixConfigDefinition.nodeTypeSet),
                                    envPath: path.resolve(uixConfigDefinition.envPath ?? '.env'),
                                    pathToConfig
                                }) as GenericUixConfig
                                await new Promise(resolve => setTimeout(resolve, 500))
                                dotenv.config({ path: uixConfig.envPath ?? '.env' })
                                applicationStore.setState({ uixConfig })
                                return uixConfig
                            },
                            catchOp: (error: Error) => {
                                console.log(error)
                                return UixErr({
                                    subtype: UixErrSubtype.UIX_CONFIG_NOT_FOUND,
                                    message: `${error.message}`,
                                    data: { relativePathToConfig }
                                })
                            },
                            render: {
                                Success: ({ data }) => <Text>✅ Uix config found @ {data.pathToConfig}</Text>,
                                Pending: () => <Loading text="Finding config..." />,
                                Error: ({ error }) => <Text color="red">Error finding config file: {error.message}</Text>
                            }
                        })
                        if (!result) return <Loading text="Finding config..." />
                        return <Command />
                    }}
                />
            </Box>
        )
    }