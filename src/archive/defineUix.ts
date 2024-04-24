import { ZodObject, z, TypeOf } from "zod";
import { v4 as uuidv4 } from 'uuid'



type DefinitionOfConcept = {
    definitionOfProperties: ZodObject<any>
    create: (...args: any) => any
}

export const defineUix = () => { }
// Rule 1: Uix is a system.
// Rule 2: The rules of Uix should extend upon themselves.
// Rule 3: Within Uix, there exists concepts
// Rule 4: All concepts that exist must have a way to be defined.
// Rule 5: All definitions of a concept must include a way to create the thing the concept represents and define the properties of that thing.
// Rule 6: A thing is defined as a single instance of a concept.
// Rule 7: A declaration is a thing that returns a definition of a thing,
// therefore, a declaration is a thing.
// Declaration identity function?

const declareConcept = <
    T extends ZodObject<any>,
    C extends (...args: any) => TypeOf<T>
>(conceptType: Capitalize<string>, definitionOfProperties: T, create: C) => {
    return {
        definitionOfProperties,
        create: (...args: Parameters<C>) => {
            return {
                conceptType,
                ...create(...args)
            }
        }
    }
}

const declareExtendedConcept = <
    M extends DefinitionOfConcept,
    T extends ZodObject<any>,
    C extends (...args: any) => TypeOf<T>
>(
    metaConcept: M,
    ...[conceptType, definitionOfProperties, create]: Parameters<typeof declareConcept<T, C>>
) => {
    return {
        definitionOfProperties: metaConcept.definitionOfProperties.merge(definitionOfProperties),
        create: (...args: any) => {
            return {
                meta: { ...metaConcept.create(...args) },
                conceptType,
                ...create(...args)
            }
        }
    }
}


// Declare, define, create
const conceptOfNode = declareConcept(
    'Node',
    z.object({
        nodeType: z.string(),
        nodeId: z.string(),
        createdAt: z.string(),
        updatedAt: z.string().optional(),
    }),
    (nodeType: Capitalize<string>) => {
        return {
            nodeType: nodeType,
            nodeId: uuidv4(),
            createdAt: new Date().toISOString(),
        }
    }
)

const conceptOfUserNode = declareExtendedConcept(
    conceptOfNode,
    'User',
    z.object({
        name: z.string(),
        age: z.number()
    }),
    (name: string, age: number) => {
        return {
            name,
            age
        }
    }
)

conceptOfNode.definitionOfProperties.






// const declareNode = declareDeclaration(
//     <T extends ZodObject<any>, C extends (...args: any) => TypeOf<T>>(nodeType: Capitalize<string>, definitionOfProperties: T, create: C) => {
//         return {
//             definitionOfProperties,
//             create: (...args: Parameters<C>) => {
//                 return {
//                     meta: conceptOfNode.create(nodeType),
//                     ...create(...args)
//                 }
//             }
//         }
//     }
// )




const definitionOfUser = declareNode(
    'User',
    z.object({
        name: z.string(),
        age: z.number()
    }),
    (name: string, age: number) => {
        return {
            name,
            age
        }
    }
)





// export const declareNode = <T extends ZodObject<any>>({
//     nodeDeclaration
// }: {
//     nodeDeclaration: T
// }) =>
//     <D extends (...args: any) => any>({
//         declareNodeDefinition
//     }: {
//         declareNodeDefinition: (nodeDeclaration: T) => D
//     }) => {
//         const defineNode = declareNodeDefinition(nodeDeclaration)
//         return {
//             defineNode,
//             declareNodeExtension: <D extends (...args: any) => any>({
//                 declareNodeExtensionDefinition
//             }: {
//                 declareNodeExtensionDefinition: (nodeDefinition: T) => D
//             }) => {
//                 const defineNodeExtension = declareNodeExtensionDefinition(nodeDeclaration)
//                 // You need to pass the return value of the defined node into the extension and and let that type define the extension
//                 return {
//                     defineNode: {
//                         defineNode,
//                     },
//                     defineNodeExtension
//                 }
//             }
//         }
//     }


// const defineNode = declareNode({
//     nodeDeclaration: z.object({
//         meta: z.object({
//             nodeType: z.string(),
//             nodeId: z.string(),
//             createdAt: z.string(),
//             updatedAt: z.string().optional(),
//         }),
//         state: z.record(z.string(), z.any()),
//         vectors: z.record(z.string(), z.object({
//             key: z.number().array(),
//             value: z.number().array(),
//         })).optional(),
//     })
// })({
//     declareNodeDefinition: nodeDeclaration => <
//         T extends Capitalize<TypeOf<typeof nodeDeclaration>['meta']['nodeType']>,
//         P extends ZodObject<any>,
//     // nodeType and stateDefinition are independent. Therefore, they can be defined in the same argument, vectors is dependent on state, so it must defined in a new level
//     >(nodeType: T, stateDefinition: P) => {
//         const nodeDefinition = nodeDeclaration.merge(z.object({
//             meta: z.object({
//                 nodeType: z.literal(nodeType),
//             }),
//             state: stateDefinition,
//         }))
//         return nodeDefinition
//     }
// })['declareNodeExtension']({
//     declareNodeExtensionDefinition: nodeDefinition => <
//         P extends ZodObject<any>,
//     >(flagVectorProperties: (keyof TypeOf<typeof nodeDefinition>)[]) => {
//         const nodeDefinitionExtension = nodeDefinition.merge(z.object({
//             vectors: flagVectorProperties.map(propertyFlag => z.object({
//                 key: z.number().array(),
//                 value: z.number().array(),
//             })).reduce((acc, current) => acc.merge(current), z.object({}))
//         }))
//         return nodeDefinitionExtension
//     }
// })

// const userNode = defineNode('User', z.object({
//     name: z.string(),
//     age: z.number()
// }))['defineNodeExtension']((nodeDefinition) => {
//     return nodeDefinition.merge(z.object({
//         vectors: z.record(z.string(), z.object({
//             key: z.number().array(),
//             value: z.number().array(),
//         }))
//     }))
// })


