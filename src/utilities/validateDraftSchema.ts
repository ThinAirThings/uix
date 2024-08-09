import { AnyZodObject, z, ZodIssue } from "zod";
import { DraftErrorTree } from "../types";






export const validateDraftSchema = <T extends Record<string, any>>(schema: AnyZodObject, draft: any): DraftErrorTree<T> | null => {
    const extendedSchema = schema.extend({
        nodeId: z.string(),
        nodeType: z.string(),
        updatedAt: z.number(),
        createdAt: z.number()
    })
    const result = extendedSchema.safeParse(draft)
    if (result?.error) {
        const createErrorTree = (issue: ZodIssue, path: any[], acc: Record<string, any>={}) => {
            if (path.length === 1) {
                acc[path[0]] = issue.message
                return acc
            }
            acc[path[0]] = acc[path[0]]??{}
            createErrorTree(issue, path.slice(1), acc[path[0]])
            return acc
        }
        const errorSet = result.error.issues.reduce((acc, issue) => {
            acc = createErrorTree(issue, issue.path, acc)
            return acc
        }, {} as any)
        return errorSet
    }
    return null
}