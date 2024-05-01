
// export type UixErr = Err<{
//     layer: string
//     type: 'Fatal' | 'Normal' | 'Warning'
//     subtype: string,
//     message?: string | undefined,
//     data?: Record<string, any>
// }>


// // Note, the first set of type arguments is the same thing as what you do on a generic function
export const ExtendUixError = <
    LayerStack extends Capitalize<string>
>() => <
    Layer extends LayerStack,
    T extends 'Fatal' | 'Normal' | 'Warning' = 'Fatal' | 'Normal' | 'Warning',
    ST extends
    | 'NodeNotFound'
    | 'UniqueIndexViolation'
    | 'UniqueRelationshipViolation'
    | 'LayerImplementationError'
    =
    | 'NodeNotFound'
    | 'UniqueIndexViolation'
    | 'UniqueRelationshipViolation'
    | 'LayerImplementationError',
    D extends Record<string, any> = Record<string, any>
>(
    layer: Layer,
    type: T,
    subtype: ST,
    opts?: {
        message?: string,
        data?: D
    }
) => ({
    layer,
    type,
    subtype,
    ...opts
})


// ExtendUixError((layer: 'Base') => {
//     return layer
// }, 'Base')
// export const UixErrorLayer = {
//     extend: ExtendUixError,
//     UixError: ExtendUixError((layer: 'Base') => {}, 'Base')
// }
// const UixError = UixErrorLayer.UixError

// const nextLayer = UixErrorLayer.extend(UixErrorLayer.UixError,  'NextjsCache')
// UixErrLayer['extend'] = <LayerStack extends Capitalize<string>>() => ({
//     UixErr: <
//         Layer extends LayerStack,
//         T extends 'Fatal' | 'Normal' | 'Warning' = 'Fatal' | 'Normal' | 'Warning',
//         ST extends
//         | 'NodeNotFound'
//         | 'UniqueIndexViolation'
//         | 'UniqueRelationshipViolation'
//         | 'LayerImplementationError'
//         =
//         | 'NodeNotFound'
//         | 'UniqueIndexViolation'
//         | 'UniqueRelationshipViolation'
//         | 'LayerImplementationError',
//         D extends Record<string, any> = Record<string, any>
//     >(
//         layer: Layer,
//         type: T,
//         subtype: ST,
//         opts?: {
//             message?: string,
//             data?: D
//         }
//     ) => ({
//         layer,
//         type,
//         subtype,
//         ...opts
//     })
// })



// export class UixErr<
//     Layer extends string,
//     T extends 'Fatal' | 'Normal' | 'Warning',
//     ST extends string,
//     D extends Record<string, any> | undefined
// > extends Err<{
//     layer: Layer
//     type: T
//     subtype: ST,
//     message?: string | undefined,
//     data?: D
// }> {
//     constructor(layer: Layer, type: T, subtype: ST, opts?: {
//         message?: string,
//         data?: D
//     }) { super({ type, layer, subtype, ...opts }) }
// }


// export class UixResult<
//     T,
//     E extends UixErr<any, any, any, any>
// > extends Result<T, E> {
//     constructor(val: T, err: E) { super(val, err) }
// }