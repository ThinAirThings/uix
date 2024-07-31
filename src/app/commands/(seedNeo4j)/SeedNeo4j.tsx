import React from 'react';
import { Text } from 'ink';
import { Loading } from '../../(components)/Loading';
import { UixErr } from '../../../types/Result';
import { useOperation } from '../../(hooks)/useOperation';
import { useApplicationStore } from '../../(stores)/applicationStore';
import { CreateUniqueIndex } from './CreateUniqueIndex';
import { Neo4jError } from 'neo4j-driver';

export const SeedNeo4j = () => {
    const uixConfig = useApplicationStore(state => state.uixConfig)
    const neo4jDriver = useApplicationStore(state => state.neo4jDriver)
    useOperation({
        dependencies: [uixConfig, neo4jDriver] as const,
        operationKey: 'createNullNode',
        tryOp: async ([uixConfig, neo4jDriver]) => {
            // Add timestamp indexes for sorting
            await neo4jDriver.executeQuery(/*cypher*/`
                CREATE INDEX node_created_at IF NOT EXISTS FOR (node:Node) ON (node.createdAt);
            `)
            await neo4jDriver.executeQuery(/*cypher*/`
                CREATE INDEX node_updated_at IF NOT EXISTS FOR (node:Node) ON (node.updatedAt);
            `)
            return true
        },
        catchOp: (error: Neo4jError) => UixErr({
            subtype: 'CLIError',
            message: `Failure in Neo4j Index Creation: ${error.message}`,
            data: error
        }),
        render: {
            Success: () => <Text>✅ Timestamp indexes created.</Text>,
            Pending: () => <Loading text="Creating timestamp indexes..." />,
            Error: ({ error }) => <Text color="red">Error creating null node: {error.data?.message}</Text>
        }
    })
    if (!uixConfig) return <></>
    return (<>
        {uixConfig.graph.nodeDefinitionSet.map(NodeType =>
            NodeType.uniqueIndexes.map(uniqueIndex =>
                <CreateUniqueIndex
                    key={`${NodeType.type}-${uniqueIndex}`}
                    nodeType={NodeType.type}
                    propertyName={uniqueIndex}
                />
            )
        )}
    </>)
}