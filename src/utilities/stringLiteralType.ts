


export const stringLiteralType = (typeName: string) => `\`\${${typeName}}\``

export const relationshipLiteralType = (relationship: '->' | '<-') => relationship === '->' 
    ? `\`-\${infer RelationshipType}->\${infer RelatedNodeType}\`` 
    : `\`<-\${infer RelationshipType}-\${infer RelatedNodeType extends keyof ConfiguredNodeDefinitionMap}\``