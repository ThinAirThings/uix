type CollectOptions = {
  limit?: number;
  page?: number;
  orderBy?: 'updatedAt' | 'createdAt';
  orderDirection?: 'ASC' | 'DESC';
};

type GenericCollectionMapEntry = {
  [relationshipType: string]: ({
    to: {
      [nodeType: string]: {
        options?: CollectOptions;
        relatedBy?: {
          [relationshipType: string]: GenericCollectionMapEntry;
        };
      };
    };
  } | {
    from: {
      [nodeType: string]: {
        options?: CollectOptions;
        relatedBy?: {
          [relationshipType: string]: GenericCollectionMapEntry;
        };
      };
    };
  });
};

type Sequence = {
  relationshipType: string[];
  node: {
    nodeType: string;
    options?: CollectOptions;
  }[];
}[];

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
    const directionSymbol = direction === 'to' ? '>' : '<';
    currentSequence.relationshipType.push(`${direction === 'to' ? `${relationshipType}>` : `<${relationshipType}`}`);

    const nodes = directionEntry[direction] as Record<string, { options?: CollectOptions; relatedBy?: GenericCollectionMapEntry }>
    for (const [nodeType, { options, relatedBy: nextRelatedBy }] of Object.entries(nodes)) {
      currentSequence.node.push({ nodeType: `+${nodeType}`, options });
      createCollectionSequence({
        relatedBy: nextRelatedBy,
        sequence,
      });
    }
  }
  sequence.push(currentSequence);
  return sequence;
};

// Example usage
const tree = {
  ACCESS_TO: {
    to: {
      Organization: {
        options: { limit: 5 },
        relatedBy: {
          BELONGS_TO: {
            from: {
              Project: {
                options: { limit: 1 },
              },
            },
          },
        },
      },
      Project: {
        options: { limit: 1 },
      },
    },
  },
};





// const sequence = createCollectionSequence({ relatedBy: tree, sequence: [] });
// console.log(JSON.stringify(sequence.reverse(), null, 2));
const params = {
  nodeType: 'User' as const,
  referenceType: 'nodeIndex' as const,
  indexKey: 'email' as const,
  indexValue: 'some-node-id' as const,
  relatedBy: tree,
};
const sequence = params.relatedBy ? createCollectionSequence({
  relatedBy: params.relatedBy as any,
  sequence: [],
}).reverse() : null
const query = /*cypher*/`
    match (referenceNode:${params.nodeType} ${params.referenceType === 'nodeIndex' ?/*cypher*/`{${params.indexKey}: $indexValue}` : ''})
    ${sequence
    ? /*cypher*/`call apoc.path.expandConfig(referenceNode, {
        sequence: "${`+${params.nodeType as string}`},${sequence.map(
      ({ relationshipType, node }) => `${relationshipType.join('|')},${node.map(({ nodeType }) => nodeType).join('|')}`).join(',')
    }"
    }) yield nodes, relationships
    `: ''}
`
// console.log(query)
const records = [
  {
    "keys": [
      "path"
    ],
    "length": 1,
    "_fields": [
      {
        "start": {
          "identity": 0,
          "labels": [
            "User",
            "Node"
          ],
          "properties": {
            "createdAt": 1721286971541,
            "nodeType": "User",
            "nodeId": "73bc9064-4eb7-4339-b36b-9cd4104767ad",
            "email": "userA@test.com",
            "updatedAt": 1721286971592
          },
          "elementId": "4:929a7abc-13dd-4fee-a8ca-c75e5eae8e9e:0"
        },
        "end": {
          "identity": 0,
          "labels": [
            "User",
            "Node"
          ],
          "properties": {
            "createdAt": 1721286971541,
            "nodeType": "User",
            "nodeId": "73bc9064-4eb7-4339-b36b-9cd4104767ad",
            "email": "userA@test.com",
            "updatedAt": 1721286971592
          },
          "elementId": "4:929a7abc-13dd-4fee-a8ca-c75e5eae8e9e:0"
        },
        "segments": [],
        "length": 0
      }
    ],
    "_fieldLookup": {
      "path": 0
    }
  },
  {
    "keys": [
      "path"
    ],
    "length": 1,
    "_fields": [
      {
        "start": {
          "identity": 0,
          "labels": [
            "User",
            "Node"
          ],
          "properties": {
            "createdAt": 1721286971541,
            "nodeType": "User",
            "nodeId": "73bc9064-4eb7-4339-b36b-9cd4104767ad",
            "email": "userA@test.com",
            "updatedAt": 1721286971592
          },
          "elementId": "4:929a7abc-13dd-4fee-a8ca-c75e5eae8e9e:0"
        },
        "end": {
          "identity": 2,
          "labels": [
            "Node",
            "Organization"
          ],
          "properties": {
            "name": "Wendy",
            "createdAt": 1721286971554,
            "nodeType": "Organization",
            "nodeId": "65523c0f-f95f-4e47-8d83-ccb72a09d48f",
            "updatedAt": 1721286971554
          },
          "elementId": "4:929a7abc-13dd-4fee-a8ca-c75e5eae8e9e:2"
        },
        "segments": [
          {
            "start": {
              "identity": 0,
              "labels": [
                "User",
                "Node"
              ],
              "properties": {
                "createdAt": 1721286971541,
                "nodeType": "User",
                "nodeId": "73bc9064-4eb7-4339-b36b-9cd4104767ad",
                "email": "userA@test.com",
                "updatedAt": 1721286971592
              },
              "elementId": "4:929a7abc-13dd-4fee-a8ca-c75e5eae8e9e:0"
            },
            "relationship": {
              "identity": 13,
              "start": 0,
              "end": 2,
              "type": "ACCESS_TO",
              "properties": {
                "accessLevel": "member",
                "strength": "weak",
                "relationshipType": "ACCESS_TO",
                "cardinality": "many-to-many"
              },
              "elementId": "5:929a7abc-13dd-4fee-a8ca-c75e5eae8e9e:13",
              "startNodeElementId": "4:929a7abc-13dd-4fee-a8ca-c75e5eae8e9e:0",
              "endNodeElementId": "4:929a7abc-13dd-4fee-a8ca-c75e5eae8e9e:2"
            },
            "end": {
              "identity": 2,
              "labels": [
                "Node",
                "Organization"
              ],
              "properties": {
                "name": "Wendy",
                "createdAt": 1721286971554,
                "nodeType": "Organization",
                "nodeId": "65523c0f-f95f-4e47-8d83-ccb72a09d48f",
                "updatedAt": 1721286971554
              },
              "elementId": "4:929a7abc-13dd-4fee-a8ca-c75e5eae8e9e:2"
            }
          }
        ],
        "length": 1
      }
    ],
    "_fieldLookup": {
      "path": 0
    }
  },
  {
    "keys": [
      "path"
    ],
    "length": 1,
    "_fields": [
      {
        "start": {
          "identity": 0,
          "labels": [
            "User",
            "Node"
          ],
          "properties": {
            "createdAt": 1721286971541,
            "nodeType": "User",
            "nodeId": "73bc9064-4eb7-4339-b36b-9cd4104767ad",
            "email": "userA@test.com",
            "updatedAt": 1721286971592
          },
          "elementId": "4:929a7abc-13dd-4fee-a8ca-c75e5eae8e9e:0"
        },
        "end": {
          "identity": 3,
          "labels": [
            "Node",
            "Project"
          ],
          "properties": {
            "name": "Wendy",
            "createdAt": 1721286971560,
            "nodeType": "Project",
            "nodeId": "e9d2d82a-4d27-4b80-8464-2f48eae00e95",
            "updatedAt": 1721286971560
          },
          "elementId": "4:929a7abc-13dd-4fee-a8ca-c75e5eae8e9e:3"
        },
        "segments": [
          {
            "start": {
              "identity": 0,
              "labels": [
                "User",
                "Node"
              ],
              "properties": {
                "createdAt": 1721286971541,
                "nodeType": "User",
                "nodeId": "73bc9064-4eb7-4339-b36b-9cd4104767ad",
                "email": "userA@test.com",
                "updatedAt": 1721286971592
              },
              "elementId": "4:929a7abc-13dd-4fee-a8ca-c75e5eae8e9e:0"
            },
            "relationship": {
              "identity": 13,
              "start": 0,
              "end": 2,
              "type": "ACCESS_TO",
              "properties": {
                "accessLevel": "member",
                "strength": "weak",
                "relationshipType": "ACCESS_TO",
                "cardinality": "many-to-many"
              },
              "elementId": "5:929a7abc-13dd-4fee-a8ca-c75e5eae8e9e:13",
              "startNodeElementId": "4:929a7abc-13dd-4fee-a8ca-c75e5eae8e9e:0",
              "endNodeElementId": "4:929a7abc-13dd-4fee-a8ca-c75e5eae8e9e:2"
            },
            "end": {
              "identity": 2,
              "labels": [
                "Node",
                "Organization"
              ],
              "properties": {
                "name": "Wendy",
                "createdAt": 1721286971554,
                "nodeType": "Organization",
                "nodeId": "65523c0f-f95f-4e47-8d83-ccb72a09d48f",
                "updatedAt": 1721286971554
              },
              "elementId": "4:929a7abc-13dd-4fee-a8ca-c75e5eae8e9e:2"
            }
          },
          {
            "start": {
              "identity": 2,
              "labels": [
                "Node",
                "Organization"
              ],
              "properties": {
                "name": "Wendy",
                "createdAt": 1721286971554,
                "nodeType": "Organization",
                "nodeId": "65523c0f-f95f-4e47-8d83-ccb72a09d48f",
                "updatedAt": 1721286971554
              },
              "elementId": "4:929a7abc-13dd-4fee-a8ca-c75e5eae8e9e:2"
            },
            "relationship": {
              "identity": 3,
              "start": 3,
              "end": 2,
              "type": "BELONGS_TO",
              "properties": {
                "strength": "strong",
                "relationshipType": "BELONGS_TO",
                "cardinality": "many-to-one",
                "testing": "test"
              },
              "elementId": "5:929a7abc-13dd-4fee-a8ca-c75e5eae8e9e:3",
              "startNodeElementId": "4:929a7abc-13dd-4fee-a8ca-c75e5eae8e9e:3",
              "endNodeElementId": "4:929a7abc-13dd-4fee-a8ca-c75e5eae8e9e:2"
            },
            "end": {
              "identity": 3,
              "labels": [
                "Node",
                "Project"
              ],
              "properties": {
                "name": "Wendy",
                "createdAt": 1721286971560,
                "nodeType": "Project",
                "nodeId": "e9d2d82a-4d27-4b80-8464-2f48eae00e95",
                "updatedAt": 1721286971560
              },
              "elementId": "4:929a7abc-13dd-4fee-a8ca-c75e5eae8e9e:3"
            }
          }
        ],
        "length": 2
      }
    ],
    "_fieldLookup": {
      "path": 0
    }
  }
]

function convertNeo4jPathToNestedObject(records) {
  const result = {};

  records.forEach(record => {
    const path = record._fields[0];
    let current = result;

    path.segments.forEach(segment => {
      const { start, relationship, end } = segment;

      // Add start node if it doesn't exist
      if (!current[start.identity]) {
        current[start.identity] = {
          ...start.properties,
          relationships: {}
        };
      }

      // Add relationship to the start node
      if (!current[start.identity].relationships[relationship.type]) {
        current[start.identity].relationships[relationship.type] = [];
      }

      // Add end node
      const endNode = {
        ...end.properties,
        relationships: {}
      };
      current[start.identity].relationships[relationship.type].push(endNode);

      // Move to the end node
      current = endNode.relationships;
    });
  });

  return result;
}

const nestedObject = convertNeo4jPathToNestedObject(records);
console.log(JSON.stringify(nestedObject, null, 2));


const input = {
  referenceType: 'nodeIndex',
  nodeType: 'User',
  indexKey: 'nodeId',
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
  }
}