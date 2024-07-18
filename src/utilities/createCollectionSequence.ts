import { CollectOptions } from "../types/RelationshipCollectionMap"


export type GenericCollectionMapEntry = {
    [relationshipType: string]: ({
        to: {
            [nodeType: string]: {
                options?: CollectOptions
                relatedBy?: {
                    [relationshipType: string]: GenericCollectionMapEntry
                }
            }
        }
    } | {
        from: {
            [nodeType: string]: {
                options?: CollectOptions
                relatedBy?: {
                    [relationshipType: string]: GenericCollectionMapEntry
                }
            }
        }
    })
}
type Sequence = {
    relationshipType: string[]
    node: {
        nodeType: string
        options?: CollectOptions
    }[]
}[]

export const createCollectionSequence = ({
    relatedBy,
    sequence = [],
}: {
    relatedBy?: GenericCollectionMapEntry;
    sequence: Sequence;
}): Sequence => {
    if (!relatedBy) return sequence;
    const currentSequence = {
        relationshipType: [] as string[],
        node: [] as {
            nodeType: string;
            options?: CollectOptions;
        }[],
    };
    for (const [relationshipType, directionEntry] of Object.entries(relatedBy)) {
        const direction = 'to' in directionEntry ? 'to' : 'from';
        currentSequence.relationshipType.push(`${direction === 'to' ? `${relationshipType}>` : `<${relationshipType}`}`);
        const nodes = directionEntry[direction as keyof typeof directionEntry] as Record<string, { options?: CollectOptions; relatedBy?: GenericCollectionMapEntry }>
        for (const [nodeType, { options, relatedBy: nextRelatedBy }] of Object.entries(nodes)) {
            currentSequence.node.push({ nodeType, options });
            createCollectionSequence({
                relatedBy: nextRelatedBy,
                sequence,
            });
        }
    }
    sequence.push(currentSequence);
    return sequence;
};