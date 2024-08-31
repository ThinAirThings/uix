



export const nextNodeTypeFromRelationshipKey = (relationshipKey: string): string => 
    relationshipKey.split('-')[2]!.replace('>', '')