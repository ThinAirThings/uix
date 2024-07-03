
import React, { FC, } from 'react';
import { Text, Box, Static } from 'ink';
import { z, TypeOf } from 'zod';
import { Loading } from '../(components)/Loading';
import { CommandEnvironment } from '../(components)/CommandEnvironment';
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { SeedNeo4j } from './(seedNeo4j)/SeedNeo4j';
import { applicationStore, useApplicationStore } from '../(stores)/applicationStore';
import { UixErr, UixErrSubtype } from '../../types/Result';
import { useOperation } from '../(hooks)/useOperation';
import { functionModuleTemplate } from '../../templates/functionModuleTemplate';
import { queryOptionsTemplate } from '../../templates/queryOptions/queryOptionsTemplate';
import { staticObjectsTemplate } from '../../templates/staticObjectsTemplate';
import { useUniqueChildTemplate } from '../../templates/hooks/useUniqueChildTemplate';
import { useNodeKeyTemplate } from '../../templates/hooks/useNodeKeyTemplate';
import { useNodeSetTemplate } from '../../templates/hooks/useNodeSetTemplate';
import { useNodeIndexTemplate } from '../../templates/hooks/useNodeIndexTemplate';
import { useNodeTypeTemplate } from '../../templates/hooks/useNodeTypeTemplate';
import { option } from 'pastel';
import { UixProviderTemplate } from '../../templates/UixProviderTemplate';
import { clientsTemplate } from '../../templates/clientsTemplate';

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
            dependencies: [useApplicationStore(store => store.uixConfig)],
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
                    path.join(outDir, 'queryOptions.ts'),
                    queryOptionsTemplate()
                )
                await writeFile(
                    path.join(outDir, 'staticObjects.ts'),
                    staticObjectsTemplate(uixConfig)
                )
                await writeFile(
                    path.join(outDir, 'useUniqueChild.ts'),
                    useUniqueChildTemplate()
                )
                await writeFile(
                    path.join(outDir, 'useNodeKey.ts'),
                    useNodeKeyTemplate()
                )
                await writeFile(
                    path.join(outDir, 'useNodeSet.ts'),
                    useNodeSetTemplate()
                )
                await writeFile(
                    path.join(outDir, 'useNodeIndex.ts'),
                    useNodeIndexTemplate()
                )
                await writeFile(
                    path.join(outDir, 'useNodeType.ts'),
                    useNodeTypeTemplate()
                )
                await writeFile(
                    path.join(outDir, 'UixProvider.tsx'),
                    UixProviderTemplate()
                )
                await writeFile(
                    path.join(outDir, 'clients.ts'),
                    clientsTemplate()
                )
                return true
            },
            catchOp: (error: Error) => UixErr({
                subtype: UixErrSubtype.CODE_GENERATION_FAILED,
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









