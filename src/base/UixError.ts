


export class UixError<
    Layer extends string,
    T extends string
> extends Error {
    layer: Layer
    errorType: T | 'NodeNotFound'
    constructor(
        layer: Layer,
        errorType: UixError<Layer, T>['errorType'],
        ...[message, options]: ConstructorParameters<typeof Error>
    ) {
        super(message, { cause: options?.cause });
        this.layer = layer;
        this.errorType = errorType;
        this.name = 'UixError';
    }
}