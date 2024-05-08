import { NodeDefinition } from "../Node/NodeDefinition";
import { GraphDefinition } from "./GraphDefinition";



export const defineGraph = <
    N extends readonly NodeDefinition<any, any, any, any>[],
>({
    nodeDefinitions,
}: {
    nodeDefinitions: N,
}) => new GraphDefinition<N, []>(nodeDefinitions, [])