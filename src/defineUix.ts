import { ZodObject, z, TypeOf } from "zod";




export const defineUix = () => { }


export const declareNode = <T extends ZodObject<any>>(metaNodeDefinition: T) =>
    // defineNode
    <D extends (...args: any) => any>(defineNode: (metaNodeDefinition: T) => D) => defineNode(metaNodeDefinition)



const defineNode = declareNode(z.object({
    meta: z.object({
        nodeType: z.string(),
        nodeId: z.string(),
        createdAt: z.string(),
        updatedAt: z.string().optional(),
    }),
    state: z.record(z.string(), z.any()),
    vectors: z.record(z.string(), z.object({
        key: z.number().array(),
        value: z.number().array(),
    })),
}))(metaNodeDefinition => <
    T extends Capitalize<TypeOf<typeof metaNodeDefinition>['meta']['nodeType']>,
    P extends ZodObject<any>,
// nodeType and stateDefinition are independent. Therefore, they can be defined in the same argument, vectors is dependent on state, so it must defined in a new level
>(nodeType: T, stateDefinition: P) => {
    const nodeDefinition = metaNodeDefinition.merge(z.object({
        meta: z.object({
            nodeType: z.literal(nodeType),
        }),
        state: stateDefinition,
    }))
    const defineNodeExtension = <E extends typeof nodeDefinition>(nodeExtension: (_nodeDefinition: typeof nodeDefinition) => E) => {
        return {
            nodeDefinition: nodeExtension(nodeDefinition),
            defineNodeExtension
        }
    }
    return {
        nodeDefinition,
        defineNodeExtension
    }
})

const userNode = defineNode('User', z.object({
    name: z.string(),
    age: z.number()
}))['defineNodeExtension']((nodeDefinition) => {
    return nodeDefinition.merge(z.object({
        vectors: z.record(z.string(), z.object({
            key: z.number().array(),
            value: z.number().array(),
        }))
    }))
})


