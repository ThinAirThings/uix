import { AnyNodeDefinitionSet } from "../definitions/NodeDefinition";




export const defineConfigv2 = <
    Type extends Capitalize<string>,
    NodeDefinitionSet extends AnyNodeDefinitionSet,
>() => {
    return {
        outdir: '',
        graph: {
            type: '',
            nodeDefinitionSet: []
        },
        pathToConfig: '',
        envPath: ''
    }
}