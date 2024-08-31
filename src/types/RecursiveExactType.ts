

/**
 * See DESIGN_NOTES.md for more information of why this type is needed.
 */
export type RecursiveExactType<
    GenericType extends Record<string, any>,
    ContraintType extends Record<string, any> = GenericType
> = {
    [K in keyof GenericType]: K extends keyof ContraintType
        ? ContraintType[K] extends Record<string, any>
            ? RecursiveExactType<GenericType[K], ContraintType[K]>
            : GenericType[K]
        : never
}