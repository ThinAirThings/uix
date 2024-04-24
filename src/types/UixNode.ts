export type UixNode<T extends Capitalize<string>, S extends Record<string, any>> = {
    nodeType: T
    nodeId: string
    createdAt: string
    updatedAt?: string
} & {
        [K in keyof S as Exclude<K, 'nodeType' | 'nodeId' | 'createdAt' | 'updatedAt'>]: S[K]
    }