



export const getRelationshipEntries = (subgraph: object) => 
    Object.entries(subgraph).filter(([key]) => key.includes('->') || key.includes('<-'))
