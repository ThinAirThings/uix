import { ZodTypeAny } from "zod";
import { LayerDefinition } from "./LayerComposition";



export const defineLayer = <
    T extends Capitalize<string>,
    Configuration extends ZodTypeAny | undefined = undefined,
    R extends Record<string, any> | undefined = undefined
>(
    layerType: T
) => new LayerDefinition<T, Configuration, R>(layerType)