

export type DraftErrorTree<
    DraftTree extends Record<string, any>
> = {
    [K in keyof DraftTree as Exclude<K, 'nodeId'|'createdAt'|'updatedAt'|'nodeType'>]?: 
        K extends `-${string}->${string}`|`<-${string}-${string}`
            ? {
                [Id in keyof DraftTree[K]]?: DraftErrorTree<DraftTree[K][Id]> 
            }
            : string
}