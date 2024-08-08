


export const removeRelationshipEntries = (subgraph: object) => 
    Object.fromEntries(Object.entries(subgraph).filter(([key, value]) => !(key.includes('->') || key.includes('<-')) || value === undefined))