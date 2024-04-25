import { UixError } from "@/src/base/UixError";



export class Neo4jLayerError extends UixError<
    'Neo4j',
    'Neo4jConnection' | 'Unknown' | 'UniqueIndexViolation' | 'NodeNotFound'
> {
    constructor(
        errorType: Neo4jLayerError['errorType'],
        ...[message, options]: ConstructorParameters<typeof Error>
    ) {
        super('Neo4j', errorType, message, { cause: options?.cause });
    }
}
