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
    envPath: string;
};

export type UixConfigWithoutPath<
    Type extends Capitalize<string>,
    NodeTypeSet extends AnyNodeTypeSet,
> = Omit<UixConfig<Type, NodeTypeSet>, 'pathToConfig'>;
export type GenericUixConfigWithoutPath = UixConfigWithoutPath<Capitalize<string>, GenericNodeTypeSet>

export type UixConfigDefinition<
    Type extends Capitalize<string>,
    NodeTypeSet extends AnyNodeTypeSet,
> = {
    type: Type;
    nodeTypeSet: NodeTypeSet;
    envPath?: string;
    outdir?: string;
}

export type GenericUixConfigDefinition = UixConfigDefinition<
    Capitalize<string>,
    GenericNodeTypeSet
>

/**
 * Represents the generic configuration for the Uix library.
 */
export type GenericUixConfig = UixConfig<
    Capitalize<string>,
    GenericNodeTypeSet
>;

/**
 * Defines the Uix configuration based on the provided options.
 * @param options - The configuration options.
 * @param options.type - The type of the graph. (ie. 'Base')
 * @param options.nodeTypeSet - An array of NodeTypes as defined by {@link defineNodeType}.
 * @param options.envPath - The optional environment path. If unspecified, defaults to '.env'.
 * @param options.outdir - The optional output directory. If unspecified, defaults to 'uix'.
 * @returns {UixConfig<Type, NodeTypeSet>} - The Uix configuration.
 */
export const defineConfig = <
    Type extends Capitalize<string>,
    NodeTypeSet extends AnyNodeTypeSet,
>(
    options: {
        type: Type;
        nodeTypeSet: NodeTypeSet;
        envPath?: string;
        outdir?: string;
    }
): UixConfigDefinition<Type, NodeTypeSet> => ({
    ...options
})


//     {
//     return {
//         outdir: options.outdir ?? path.join('uix', 'output'),
//         graph: new GraphType(
//             options.type,
//             options.nodeTypeSet,
//         ),
//         envPath: options.envPath ?? '.env',
//     };
// };
