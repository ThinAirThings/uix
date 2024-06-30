import { expect } from "vitest"
import { AnyErrType } from "../../src/types/Result"


export function throwTestError<
    Err extends AnyErrType
>(err: Err): never {
    console.error(err)
    expect(err).toBeFalsy()
    throw new Error(JSON.stringify(err, null, 2))
}