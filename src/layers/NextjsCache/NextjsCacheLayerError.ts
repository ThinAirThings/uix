


import { UixError } from "@/src/base/UixError";

export class NextjsCacheLayerError extends UixError<
    'Nextjs',
    'Unknown'
> {
    constructor(
        errorType: NextjsCacheLayerError['errorType'],
        ...[message, options]: ConstructorParameters<typeof Error>
    ) {
        super('Nextjs', errorType, message, { cause: options?.cause });
    }
}
