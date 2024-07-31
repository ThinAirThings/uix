
import React, { FC, } from 'react';
import { Text, Box, Static } from 'ink';
import { z, TypeOf } from 'zod';
import { Loading } from '../(components)/Loading';
import { CommandEnvironment } from '../(components)/CommandEnvironment';
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { SeedNeo4j } from './(seedNeo4j)/SeedNeo4j';
import { useApplicationStore } from '../(stores)/applicationStore';
import { UixErr } from '../../types/Result';
import { useOperation } from '../(hooks)/useOperation';
import { functionModuleTemplate } from '../../templates/functionModuleTemplate';
import { staticObjectsTemplate } from '../../templates/staticObjectsTemplate';
import { option } from 'pastel';
import { UixProviderTemplate } from '../../templates/UixProviderTemplate';
import { clientsTemplate } from '../../templates/clientsTemplate';
import { useSubgraphTemplate } from '../../templates/hooks/useSubgraphTemplate';
import { useSubgraphDraftTemplate } from '../../templates/hooks/useSubgraphDraftTemplate';

export const options = z.object({
    config: z.string().optional().describe(
        option({
            description: 'Path to uix.config file',
            alias: 'c',
        })
    ),
});

export type CodegenOptions = TypeOf<typeof options>;
export const isDefault = true;

const Codegen: FC<{
    options: TypeOf<typeof options>;
}> = ({
    options
}) => CommandEnvironment({
    relativePathToConfig: options.config,
    Command: () => {
        // Generate Code
        useOperation({
            dependencies: [useApplicationStore(store => store.uixConfig)] as const,
            operationKey: 'codeGeneration',
            tryOp: async ([uixConfig]) => {
                await new Promise(resolve => setTimeout(resolve, 500))
                const outDir = uixConfig.outdir
                await mkdir(outDir, { recursive: true })
                await writeFile(
                    path.join(outDir, 'functionModule.ts'),
                    functionModuleTemplate(uixConfig)
                )
                await writeFile(
                    path.join(outDir, 'staticObjects.ts'),
                    staticObjectsTemplate(uixConfig)
                )
                await writeFile(
                    path.join(outDir, 'useSubgraph.ts'),
                    useSubgraphTemplate()
                )
                await writeFile(
                    path.join(outDir, 'useSubgraphDraft.ts'),
                    useSubgraphDraftTemplate()
                )
                await writeFile(
                    path.join(outDir, 'UixProvider.tsx'),
                    UixProviderTemplate()
                )
                await writeFile(
                    path.join(outDir, 'clients.ts'),
                    clientsTemplate(uixConfig)
                )
                return true
            },
            catchOp: (error: Error) => UixErr({
                subtype: 'CLIError',
                message: `Code generation failed: ${error.message}`,
                data: { error }
            }),
            render: {
                Success: ({ dependencies: [uixConfig] }) => <Text>✅ Code Generated @{uixConfig.outdir}: Fully-typed operations</Text>,
                Pending: () => <Loading text="Generating code..." />,
                Error: ({ error }) => <Text >❌ Error generating code: {error.message}</Text>
            }
        })
        const outputMap = useApplicationStore(store => store.outputMap)
        const pendingSet = useApplicationStore(store => store.pendingSet)
        return (<>
            <Static items={[...outputMap]}>
                {([key, { Component }]) => <Box key={key}><Component /></Box>}
            </Static>
            <Box flexDirection='column'>
                {pendingSet.size > 0 && <Loading text="Generating code..." />}
            </Box>
            <SeedNeo4j />
        </>
        )
    }
})

export default Codegen;









