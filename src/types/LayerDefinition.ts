import { GraphLayer } from "./GraphLayer"


export type LayerDefinition<
    G extends GraphLayer<any, any, any, any>,
    Configuration extends Record<string, any> = Record<string, any>
> = (
    graph: G,
    configuration?: Configuration
) => G