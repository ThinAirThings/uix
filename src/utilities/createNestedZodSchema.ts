import { AnyZodObject, z } from "zod"
import { GenericNodeShapeTree } from "../fns/extractSubgraphFactory"
import { getRelationshipEntries } from "./getRelationshipEntries"
import { AnyNodeDefinitionMap } from "../definitions/NodeDefinition"



export const createNestedZodSchema = (nodeDefinitionMap: AnyNodeDefinitionMap, node: GenericNodeShapeTree, acc: AnyZodObject=z.object({})) => {
    const nextSchema = nodeDefinitionMap[node.nodeType as keyof typeof nodeDefinitionMap]!.stateSchema
    acc = acc.merge(nextSchema)
    getRelationshipEntries(node).forEach(([key, nextNodeSet]) => {
        if (Array.isArray(nextNodeSet)) {
            acc = acc.extend({
                [key]: z.array(createNestedZodSchema(nodeDefinitionMap,{
                    ...nextNodeSet[0],
                    nodeType: key.split('-')[2]!.replace('>', '')
                }, z.object({})))
            })
        } else {
            acc.extend({
                [key]: createNestedZodSchema(
                    nodeDefinitionMap, {
                    ...nextNodeSet,
                    nodeType: key.split('-')[2]!.replace('>', '')
                }, z.object({}))
            })
        }
    })
    return acc
}