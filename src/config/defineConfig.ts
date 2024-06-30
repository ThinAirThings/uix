import { AnyNodeTypeSet, GenericNodeTypeSet } from "../types/NodeType";
import { GraphType } from "../types/GraphType";
import path from 'path';
import { getCallerFile } from "../app/(utilities)/getCallerFile";

/**
 * Represents the configuration for the Uix library.
 * @template Type - The type of the graph.
 * @template NodeTypeSet - The type of the node set.
 */
export type UixConfig<
    Type extends Capitalize<string>,
    NodeTypeSet extends AnyNodeTypeSet,
> = {
    outdir: string;
    graph: GraphType<Type, NodeTypeSet>;
    pathToConfig: string;
    neo4jConfig: {
        uri: string;
        username: string;
        password: string;
    };
    openaiConfig: {
        apiKey: string;
    };
};

/**
 * Represents the generic configuration for the Uix library.
 */
export type GenericUixConfig = UixConfig<
    Capitalize<string>,
    GenericNodeTypeSet
>;

/**
 * Defines the Uix configuration based on the provided options.
 * @template Type - The type of the graph.
 * @template NodeTypeSet - The type of the node set.
 * @param options - The configuration options.
 * @returns The Uix configuration.
 */
export const defineConfig = <
    Type extends Capitalize<string>,
    NodeTypeSet extends AnyNodeTypeSet,
>(
    options: Omit<
        UixConfig<Type, NodeTypeSet>,
        'graph' | 'pathToConfig'
    > & {
        type: Type;
        nodeTypeSet: NodeTypeSet;
    }
): UixConfig<
    Type,
    NodeTypeSet
> => {
    return {
        outdir: options.outdir ?? path.join('uix', 'output'),
        graph: new GraphType(
            options.type,
            options.nodeTypeSet,
        ),
        openaiConfig: options.openaiConfig,
        pathToConfig: getCallerFile(),
        neo4jConfig: options.neo4jConfig
    };
};
