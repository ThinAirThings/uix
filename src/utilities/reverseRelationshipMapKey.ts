import { RelationshipMapKey } from "./subgraphRecursion";



export const reverseRelationshipMapKey = (previousNodeType: string, relationshipMapKey: RelationshipMapKey) => {
    if (relationshipMapKey.includes('->')) {
        // Convert `-${A}->${B}` to `<-${A}-${B}`
        const [left, right] = relationshipMapKey.split('->') as [string, string];
        return `<-${left.slice(1)}-${previousNodeType}`;
    } else if (relationshipMapKey.startsWith('<-')) {
        // Convert `<-${A}-${B}` to `-${A}->${B}`
        const [left, right] = relationshipMapKey.slice(2).split('-');
        return `-${left}->${previousNodeType}`;
    }

    return relationshipMapKey; // Return unchanged if it doesn't match either format
}