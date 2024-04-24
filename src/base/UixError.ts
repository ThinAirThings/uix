



export class UixError extends Error {
    errorType: 'Warning' | 'Fatal'
    constructor(
        errorType: UixError['errorType'],
        ...[message, options]: ConstructorParameters<typeof Error>
    ) {
        super(message, { cause: options?.cause });
        this.errorType = errorType;
        this.name = 'UixError';
    }
}