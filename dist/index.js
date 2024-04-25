// src/base/defineGraph.ts
import { v4 as uuidv4 } from "uuid";
var defineGraph = ({
  nodeDefinitions,
  relationshipDefinitions,
  edgeDefinitions,
  uniqueIndexes
}) => {
  return {
    nodeDefinitions,
    relationshipDefinitions,
    edgeDefinitions,
    uniqueIndexes,
    createNode: (nodeType, initialState) => {
      const node = {
        nodeType,
        nodeId: uuidv4(),
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        ...initialState
      };
      return node;
    },
    createRelationship: (fromNode, relationshipType, toNode, ...[state]) => {
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
  const uniqueIndexesCreated = [
    ...graph.nodeDefinitions.map(async ({ nodeType }) => createUniqueIndex(neo4jDriver, nodeType, "nodeId")),
    ...(graph.uniqueIndexes && Object.entries(graph.uniqueIndexes).map(([nodeType, index]) => {
      return createUniqueIndex(neo4jDriver, nodeType, index);
    })) ?? []
  ];
  return {
    ...graph,
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
        return await session.executeRead(async (tx) => {
          return await tx.run(`
                        MATCH (node:${nodeType} {${nodeIndex}: $indexKey})
                        RETURN node
                    `, { indexKey });
        }).then(({ records }) => records.map((record) => record.get("node").properties)[0]);
      } finally {
        session.close();
      }
    },
    updateNode: async ({ nodeType, nodeId }, state) => {
      if (!neo4jDriver)
        throw new Error("Neo4jNode.neo4jDriver is not configured");
      const session = neo4jDriver.session();
      try {
        return await session.executeWrite(async (tx) => {
          return await tx.run(`
                        MATCH (node:${nodeType} {nodeId: $nodeId})
                        SET node += $state
                        RETURN node
                    `, { nodeId, state });
        }).then(({ records }) => records.map((record) => record.get("node").properties)[0]);
      } catch (e) {
        console.error(e);
        throw e;
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
  return {
    ...graph,
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
      graph.uniqueIndexes[nodeType].map((indexKey) => `${nodeType}-${indexKey}-${node[indexKey]}`).forEach(revalidateTag);
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
