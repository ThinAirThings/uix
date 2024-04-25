



export type UixRelationship<
    T extends Uppercase<string>, 
    S extends Record<string, any> | void
> = {
    relationshipType: T
    relationshipId: string
    createdAt: string
    updatedAt?: string
} & {
        [K in keyof S as Exclude<K, 'relationshipType' | 'relationshipId' | 'createdAt' | 'updatedAt'>]: S[K]
    }





