
import dedent from 'dedent'
type NodeRelation = ({
    direction: 'to' | 'from';
    nodeType: string;
    options?: { limit: number };
}) | (({
    [relationshipType: string]: NodeRelation;
}))


type GraphQuery = {
    referenceType: 'nodeIndex';
    nodeType: string;
    indexKey: string;
    indexValue: string;
    options?: { limit: number };
} | ({
    [relationshipType: string]: NodeRelation;
})

const input2: NodeRelation = {
    direction: 'to',
    nodeType: 'Organization',
    options: { limit: 1 },
    'BELONGS_TO': {
        direction: 'from',
        nodeType: 'Project',
        options: { limit: 1 }
    }
}

const input: GraphQuery = {
    referenceType: 'nodeIndex',
    nodeType: 'User',
    indexKey: 'email',
    indexValue: "userA@test.com",
    'ACCESS_TO': {
        direction: 'to',
        nodeType: 'Organization',
        options: { limit: 1 },
        'BELONGS_TO': {
            direction: 'from',
            nodeType: 'Project',
            options: { limit: 1 }
        }
    },
    'SENT_BY': {
        direction: 'from',
        nodeType: 'Message',
        options: { limit: 2 }
    }
};

const createQueryString = (
    graphQuery: GraphQuery
) => {
    let queryString = dedent/*cypher*/`
        match (n_0_0:${graphQuery.nodeType} {${graphQuery.indexKey}: "${graphQuery.indexValue}"})
        ${'options' in graphQuery && graphQuery.options && 'limit' in graphQuery.options
            ? dedent/*cypher*/`
                with n0
                limit ${graphQuery.options.limit}
            `
            : ''
        }
    `
    let variableList = ['n_0_0']
    const relationshipKeys = Object.keys(graphQuery).filter((key) => !['referenceType', 'nodeType', 'indexKey', 'indexValue'].includes(key))
    const createPath = (relationshipType: string, nodeRelation: NodeRelation, dimension: number, depth: number) => {
        const newVariables = [`n_${dimension}_${depth}`, `r_${dimension}_${depth}`]
        variableList.push(...newVariables)
        queryString += dedent/*cypher*/`\n
            call {
                with n_${(dimension > 0 && depth === 1) ? 0 : dimension}_${depth - 1}
                match (n_${(dimension > 0 && depth === 1) ? 0 : dimension}_${depth - 1})${nodeRelation.direction === 'from' ? '<' : ''}-[r_${dimension}_${depth}:${relationshipType}]-${nodeRelation.direction === 'to' ? '>' : ''}(n_${dimension}_${depth}:${nodeRelation.nodeType})
                ${'options' in nodeRelation && nodeRelation.options && 'limit' in nodeRelation.options
                ? dedent/*cypher*/`
                    return ${newVariables.join(', ')}
                    limit ${nodeRelation.options.limit}
                ` : ''
            }
            }
            
        `
        const relationshipKeys = Object.keys(nodeRelation).filter((key) => !['direction', 'nodeType', 'options'].includes(key))
        relationshipKeys.forEach((key, idx) => {
            createPath(key, nodeRelation[key as keyof typeof nodeRelation] as NodeRelation, idx, depth + 1)
        })
    }
    relationshipKeys.forEach((key, idx) => graphQuery[key as keyof typeof graphQuery] && createPath(key, graphQuery[key as keyof typeof graphQuery] as NodeRelation, idx, 1))
    queryString += dedent/*cypher*/`\n
        return ${variableList.join(', ')}
    `
    return queryString
}

console.log(createQueryString(input))

