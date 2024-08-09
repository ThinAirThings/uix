import { AnyZodObject, z } from "zod"
import { AnyNodeDefinitionMap } from "../definitions/NodeDefinition"
import { GenericMergeOutputTree } from "../fns/extractSubgraphFactory"
import { getRelationshipEntries } from "./getRelationshipEntries"

export const createNestedZodSchema = (nodeDefinitionMap: AnyNodeDefinitionMap, node: GenericMergeOutputTree, acc: AnyZodObject=z.object({})) => {
    const nextSchema = nodeDefinitionMap[node.nodeType as keyof typeof nodeDefinitionMap]!.stateSchema
    acc = acc.merge(nextSchema)
    getRelationshipEntries(node).forEach(([key, nextNodeMap]) => {
        Object.entries(nextNodeMap).forEach(([_, node]) => {
            acc = acc.extend({
                [key]: z.record(z.string(), createNestedZodSchema(nodeDefinitionMap, {
                    ...node as any,
                    nodeType: key.split('-')[2]!.replace('>', '')
                }, z.object({})))
            })
        })
    })
    return acc
}