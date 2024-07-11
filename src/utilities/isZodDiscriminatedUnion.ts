import { ZodDiscriminatedUnion, ZodTypeAny } from "zod";
import { AnyZodDiscriminatedUnion } from "../types/NodeType";


/**
 * This function is necessary because of all the different instances of zod that are
 * seemingly being created. This allows us to check for the ZodDiscriminatedUnion type
 * without relying on a single import of zod existing.
 * 
 * @param schema 
 * @returns 
 */

export const isZodDiscriminatedUnion = (schema: ZodTypeAny): schema is AnyZodDiscriminatedUnion => {
    if (schema._def.typeName === 'ZodDiscriminatedUnion') {
        return true
    }
    return false
}