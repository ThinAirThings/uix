import { UixError } from "../base/UixErr"

export type UixResult<T extends 'success' | 'error', R> = {
    type: T
    success: boolean
    result: T extends 'success' ? R : UixError<any, any>
}

export const createResult = <
    T extends 'success' | 'error',
    R extends (T extends 'success' ? any : UixError<any, any>),
>(
    type: T,
    result: R
): {
    type: T;
    result: R;
    success: T extends 'success' ? true : false;
} => ({
    type,
    success: type === 'success' ? true : false,
    result
});

export const success = <
    T extends any
>(result: T) => createResult('success', result)

export const error = <
    T extends UixError<any, any>
>(result: T) => createResult('error', result)