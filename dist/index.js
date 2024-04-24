// src/base/defineGraph.ts
import { v4 as uuidv4 } from "uuid";
var defineGraph = ({
  nodeDefinitions,
  relationshipDefinitions
}) => {
  const nodeMap = /* @__PURE__ */ new Map();
  return {
    nodeDefinitions,
    relationshipDefinitions,
    createNode: (nodeType, initialState) => {
      const node = {
        nodeType,
        nodeId: uuidv4(),
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        ...initialState
      };
      nodeMap.set(node.nodeId, node);
      return node;
    },
    getNode: ({ nodeType, nodeId }) => {
      const node = nodeMap.get(nodeId);
      return node;
    },
    updateNode: ({ nodeType, nodeId }, state) => {
      const node = nodeMap.get(nodeId);
      if (!node)
        throw new Error("Node not found");
      nodeMap.set(nodeId, {
        ...node,
        ...state
      });
      return nodeMap.get(nodeId);
    }
  };
};

// src/base/defineNode.ts
var defineNode = (nodeType, stateDefinition) => ({
  nodeType,
  stateDefinition
});

// src/layers/Neo4j/Neo4jLayer.ts
import neo4j from "neo4j-driver";

// src/base/UixError.ts
var UixError = class extends Error {
  errorType;
  constructor(errorType, ...[message, options]) {
    super(message, { cause: options?.cause });
    this.errorType = errorType;
    this.name = "UixError";
  }
};

// src/layers/Neo4j/createUniqueIndex.ts
var createUniqueIndex = async (neo4jDriver, nodeType, propertyName) => {
  const neo4jSession = neo4jDriver.session();
  try {
    console.log(`Creating unique index for ${nodeType}.${propertyName}`);
    return await neo4jSession.executeWrite(async (tx) => tx.run(`
            CREATE CONSTRAINT ${propertyName}_index IF NOT EXISTS
            FOR (node:${nodeType})
            REQUIRE node.${propertyName} IS UNIQUE
        `));
  } catch (error) {
    throw new UixError("Fatal", "Error creating unique index in Neo4j", {
      cause: error
    });
  } finally {
    neo4jSession.close();
  }
};

// src/layers/Neo4j/Neo4jLayer.ts
var Neo4jLayer = (graph, config) => {
  const neo4jDriver = neo4j.driver(config.connection.uri, neo4j.auth.basic(
    config.connection.user,
    config.connection.password
  ));
  const nodeDefinitions = graph.nodeDefinitions;
  const uniqueIndexesCreated = [
    ...nodeDefinitions.map(async ({ nodeType }) => createUniqueIndex(neo4jDriver, nodeType, "nodeId")),
    ...(config.uniqueIndexes && Object.entries(config.uniqueIndexes).map(([nodeType, index]) => {
      return createUniqueIndex(neo4jDriver, nodeType, index);
    })) ?? []
  ];
  return {
    uniqueIndexes: config.uniqueIndexes,
    nodeDefinitions: graph.nodeDefinitions,
    relationshipDefinitions: graph.relationshipDefinitions,
    createNode: async (nodeType, initialState) => {
      await Promise.all(uniqueIndexesCreated);
      const newNode = graph.createNode(nodeType, initialState);
      if (!neo4jDriver)
        throw new Error("Neo4jNode.neo4jDriver is not configured");
      const session = neo4jDriver.session();
      try {
        const result = await session.run(`
                    CREATE (n:${nodeType} $newNode)
                    RETURN n
                `, { newNode });
        return newNode;
      } finally {
        session.close();
      }
    },
    getNode: async (nodeType, nodeIndex, indexKey) => {
      if (!neo4jDriver)
        throw new Error("Neo4jNode.neo4jDriver is not configured");
      const session = neo4jDriver.session();
      try {
        const result = await session.run(`
                    MATCH (n:${nodeType} {${nodeIndex}: $indexKey})
                    RETURN n
                `, { indexKey });
        return result.records[0].get("n").properties;
      } finally {
        session.close();
      }
    },
    updateNode: async ({ nodeType, nodeId }, state) => {
      if (!neo4jDriver)
        throw new Error("Neo4jNode.neo4jDriver is not configured");
      const session = neo4jDriver.session();
      try {
        const result = await session.run(`
                    MATCH (n:${nodeType} {nodeId: $nodeId})
                    SET n += $state
                    RETURN n
                `, { nodeId, state });
        return result.records[0].get("n").properties;
      } catch (e) {
        console.error(e);
      } finally {
        session.close();
      }
    },
    createRelationship: async (fromNode, relationshipType, toNode, ...[state]) => {
      if (!neo4jDriver)
        throw new Error("Neo4jNode.neo4jDriver is not configured");
      const session = neo4jDriver.session();
      try {
        const result = await session.run(`
                    MATCH (from:${fromNode.nodeType} {nodeId: $fromNode.nodeId})
                    MATCH (to:${toNode.nodeType} {nodeId: $toNode.nodeId})
                    MERGE (from)-[:${relationshipType}]->(to)
                    RETURN from, to
                `, { fromNode, toNode });
        return {
          fromNode: result.records[0].get("from").properties,
          toNode: result.records[0].get("to").properties
        };
      } finally {
        session.close();
      }
    },
    getRelatedTo: async (fromNode, relationshipType, toNodeType) => {
      if (!neo4jDriver)
        throw new Error("Neo4jNode.neo4jDriver is not configured");
      const session = neo4jDriver.session();
      try {
        const { nodeType, nodeId } = fromNode;
        return await session.executeRead(async (tx) => {
          return await tx.run(`
                        MATCH (fromNode:${nodeType} {nodeId: $fromNodeId})-[:${relationshipType}]->(toNode:${toNodeType})
                        RETURN toNode
                    `, { fromNodeId: nodeId });
        }).then(({ records }) => records.map((record) => record.get("toNode").properties));
      } finally {
        session.close();
      }
    }
  };
};

// src/layers/NextjsCache/NextjsCacheLayer.ts
import { unstable_cache as cache, revalidateTag } from "next/cache";
var NextjsCacheLayer = (graph) => {
  const cacheMap = /* @__PURE__ */ new Map();
  const uniqueIndexes = graph["uniqueIndexes"];
  return {
    getNode: async (nodeType, nodeIndex, indexKey) => {
      const cacheKey = `${nodeType}-${nodeIndex}-${indexKey}`;
      if (!cacheMap.has(cacheKey)) {
        cacheMap.set(cacheKey, cache(
          async (...[nodeType2, index, key]) => {
            return await graph.getNode(nodeType2, index, key);
          },
          [cacheKey],
          {
            tags: [cacheKey]
          }
        ));
      }
      const node = await graph.getNode(nodeType, nodeIndex, indexKey);
      return node;
    },
    updateNode: async ({ nodeType, nodeId }, state) => {
      const node = await graph.updateNode({ nodeType, nodeId }, state);
      uniqueIndexes[nodeType].map((indexKey) => `${nodeType}-${indexKey}-${node[indexKey]}`).forEach(revalidateTag);
      return node;
    }
  };
};
export {
  Neo4jLayer,
  NextjsCacheLayer,
  defineGraph,
  defineNode
};
