import { Err } from "@/src/types/Result";



export const UixLayerError = <
    LayerType extends Capitalize<string>,
>(
    layerType: LayerType
) => <
    Type extends Capitalize<string>,
    Data extends Record<string, any> | undefined = undefined
>(
    type: Type,
    message: string,
    data?: Data
) => Err({
    layer: layerType,
    type,
    message,
    data: data as Data extends Record<string, any> ? Data : undefined
})