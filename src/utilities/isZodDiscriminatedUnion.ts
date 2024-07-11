import { ZodDiscriminatedUnion, ZodTypeAny } from "zod";


/**
 * This function is necessary because of all the different instances of zod that are
 * seemingly being created. This allows us to check for the ZodDiscriminatedUnion type
 * without relying on a single import of zod existing.
 * 
 * @param schema 
 * @returns 
 */

export const isZodDiscriminatedUnion = (schema: ZodTypeAny): schema is ZodDiscriminatedUnion<any, any> => {
    if (schema._def.typeName === 'ZodDiscriminatedUnion') {
        return true
    }
    return false
}