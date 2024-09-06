import _ from "lodash"
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { subscribeWithSelector } from 'zustand/middleware'
import { enableMapSet } from "immer"
import { GenericNodeShape } from "../../definitions/NodeDefinition"

enableMapSet()
export const graphStore = create<{
    nodeMap: Map<string, GenericNodeShape>,
    fromNodePointerMap: Map<`${string}:${string}:${string}`, Set<string>>,
    toNodePointerMap: Map<`${string}:${string}:${string}`, Set<string>>,
    relationshipMap: Map<`${string}:${string}:${string}`, Record<string, any>>
}>()(
    immer(
        subscribeWithSelector(
            () => ({
                nodeMap: new Map<string, GenericNodeShape>(),
                fromNodePointerMap: new Map<`${string}:${string}:${string}`, Set<string>>(),
                toNodePointerMap: new Map<`${string}:${string}:${string}`, Set<string>>(),
                relationshipMap: new Map<`${string}:${string}:${string}`, Record<string, any>>(),
            })
        )
    )
)

