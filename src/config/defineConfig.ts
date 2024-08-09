import { AnyNodeDefinitionSet, GenericNodeDefinitionSet } from "../definitions/NodeDefinition";
import { GraphDefinition } from "../definitions/GraphDefinition";
import { useUixFactory } from "../hooks/useUixFactory";

/**
 * Represents the configuration for the Uix library.
 * @template Type - The type of the graph.
 * @template NodeDefinitionSet - The type of the node set.
 */
export type UixConfig<
    Type extends Capitalize<string>,
    NodeDefinitionSet extends AnyNodeDefinitionSet,
> = {
    outdir: string;
    graph: GraphDefinition<Type, NodeDefinitionSet>;
    pathToConfig: string;
    envPath: string;
};

export type UixConfigWithoutPath<
    Type extends Capitalize<string>,
    NodeDefinitionSet extends AnyNodeDefinitionSet,
> = Omit<UixConfig<Type, NodeDefinitionSet>, 'pathToConfig'>;
export type GenericUixConfigWithoutPath = UixConfigWithoutPath<Capitalize<string>, GenericNodeDefinitionSet>

export type UixConfigDefinition<
    Type extends Capitalize<string>,
    NodeDefinitionSet extends AnyNodeDefinitionSet,
> = {
    type: Type;
    nodeDefinitionSet: NodeDefinitionSet;
    envPath?: string;
    outdir?: string;
}

export type GenericUixConfigDefinition = UixConfigDefinition<
    Capitalize<string>,
    GenericNodeDefinitionSet
>

/**
 * Represents the generic configuration for the Uix library.
 */
export type GenericUixConfig = UixConfig<
    Capitalize<string>,
    GenericNodeDefinitionSet
>;

/**
 * Defines the Uix configuration based on the provided options.
 * @param options - The configuration options.
 * @param options.type - The type of the graph. (ie. 'Base')
 * @param options.nodeDefinitionSet - An array of NodeDefinitions as defined by {@link defineNodeDefinition}.
 * @param options.envPath - The optional environment path. If unspecified, defaults to '.env'.
 * @param options.outdir - The optional output directory. If unspecified, defaults to 'uix'.
 * @returns {UixConfig<Type, NodeDefinitionSet>} - The Uix configuration.
 */
export const defineConfig = <
    Type extends Capitalize<string>,
    NodeDefinitionSet extends AnyNodeDefinitionSet,
>(
    options: {
        type: Type;
        nodeDefinitionSet: NodeDefinitionSet;
        envPath?: string;
        outdir?: string;
    }
) => ({
    ...options,
    nodeDefinitionSet: options.nodeDefinitionSet,
})
