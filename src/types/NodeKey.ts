import { AnyNodeDefinitionMap } from "../definitions/NodeDefinition"

export type GenericNodeKey = NodeKey<
    AnyNodeDefinitionMap,
    keyof AnyNodeDefinitionMap
>
export type NodeKey<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    NodeDefinition extends ({
        [K in keyof NodeDefinitionMap]: NodeDefinitionMap[K]['type'] | `${NodeDefinitionMap[K]['type']}Vector`
    }[keyof NodeDefinitionMap])
> = {
    nodeType: NodeDefinition
    nodeId: string
}

export type VectorKeys<NodeDefinitionMap extends AnyNodeDefinitionMap> = {
    [Type in keyof NodeDefinitionMap]: `${NodeDefinitionMap[Type]['type']}Vector`
}[keyof NodeDefinitionMap]

export type TypeFromVectorType<
    NodeDefinitionMap extends AnyNodeDefinitionMap,
    T extends VectorKeys<NodeDefinitionMap>
> = T extends `${infer U}Vector` ? U : never