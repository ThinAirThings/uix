


export type NodeKey<T extends Capitalize<string>> = {
    nodeType: T
    nodeId: string
}