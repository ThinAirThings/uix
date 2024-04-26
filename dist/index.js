// src/base/defineGraph.ts
import { v4 as uuidv4 } from "uuid";
import { Ok } from "ts-results";
var defineGraph = ({
  nodeDefinitions,
  relationshipDefinitions,
  edgeDefinitions,
  uniqueIndexes
}) => {
  const definitionMap = /* @__PURE__ */ new Map();
  nodeDefinitions.forEach((definition) => {
    definitionMap.set(definition.nodeType, definition);
  });
  return {
    nodeDefinitions,
    relationshipDefinitions,
    edgeDefinitions,
    uniqueIndexes,
    createNode: async (nodeType, initialState) => {
      const node = {
        nodeType,
        nodeId: uuidv4(),
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        ...initialState
      };
      return new Ok(node);
    },
    getDefinition: (nodeType) => {
      return definitionMap.get(nodeType);
    },
    getNodeType: (nodeType) => {
      throw new Error(`getNodeType should never be called in the runtime. It's a type-level utlity function.`);
      return null;
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

// src/layers/Neo4j/createUniqueIndex.ts
var createUniqueIndex = async (neo4jDriver, nodeType, propertyName) => {
  const neo4jSession = neo4jDriver.session();
  try {
    console.log(`Creating unique index for ${nodeType}.${propertyName}`);
    return await neo4jSession.executeWrite(async (tx) => await tx.run(`
            CREATE CONSTRAINT ${propertyName}_index IF NOT EXISTS
            FOR (node:${nodeType})
            REQUIRE node.${propertyName} IS UNIQUE
        `));
  } catch (error) {
    throw error;
  } finally {
    await neo4jSession.close();
  }
};

// src/base/UixError.ts
var UixError = class extends Error {
  layer;
  errorType;
  constructor(layer, errorType, ...[message, options]) {
    super(message, { cause: options?.cause });
    this.layer = layer;
    this.errorType = errorType;
    this.name = "UixError";
  }
};

// src/layers/Neo4j/Neo4jLayerError.ts
var Neo4jLayerError = class extends UixError {
  constructor(errorType, ...[message, options]) {
    super("Neo4j", errorType, message, { cause: options?.cause });
  }
};

// src/layers/Neo4j/Neo4jLayer.ts
import { Ok as Ok2, Err as Err2 } from "ts-results";
var Neo4jLayer = (graph, config) => {
  const neo4jDriver = neo4j.driver(config.connection.uri, neo4j.auth.basic(
    config.connection.username,
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
    neo4jDriver,
    createNode: async (nodeType, initialState) => {
      await Promise.all(uniqueIndexesCreated);
      const newNode = await graph.createNode(nodeType, initialState);
      if (!neo4jDriver)
        throw new Error("Neo4jNode.neo4jDriver is not configured");
      const session = neo4jDriver.session();
      try {
        const result = await session.executeWrite(async (tx) => {
          return await tx.run(`
                        CREATE (node:${nodeType} $newNode)
                        RETURN node
                    `, { newNode: newNode.ok ? newNode.val : {} });
        }).then(({ records }) => records.map((record) => record.get("node").properties)[0]);
        return new Ok2(result);
      } catch (_e) {
        const e = _e;
        if (e.message === "Neo.ClientError.Schema.ConstraintValidationFailed") {
          return new Err2(new Neo4jLayerError("UniqueIndexViolation", e.message));
        }
        return new Err2(new Neo4jLayerError("Unknown", e.message));
      } finally {
        await session.close();
      }
    },
    getNode: async (nodeType, nodeIndex, indexKey) => {
      if (!neo4jDriver)
        throw new Error("Neo4jNode.neo4jDriver is not configured");
      const session = neo4jDriver.session();
      try {
        const result = await session.executeRead(async (tx) => {
          return await tx.run(`
                        MATCH (node:${nodeType} {${nodeIndex}: $indexKey})
                        RETURN node
                    `, { indexKey });
        }).then(({ records }) => records.length ? records.map((record) => record.get("node").properties)[0] : null);
        if (!result)
          return new Err2(new Neo4jLayerError("NodeNotFound", `Node of type ${nodeType} with ${nodeIndex} ${indexKey} not found`));
        return new Ok2(result);
      } catch (_e) {
        const e = _e;
        return new Err2(new Neo4jLayerError("NodeNotFound", e.message));
      } finally {
        session.close();
      }
    },
    updateNode: async ({ nodeType, nodeId }, state) => {
      if (!neo4jDriver)
        throw new Error("Neo4jNode.neo4jDriver is not configured");
      const session = neo4jDriver.session();
      try {
        const result = await session.executeWrite(async (tx) => {
          return await tx.run(`
                        MATCH (node:${nodeType} {nodeId: $nodeId})
                        SET node += $state
                        RETURN node
                    `, { nodeId, state });
        }).then(({ records }) => records.map((record) => record.get("node").properties)[0]);
        return new Ok2(result);
      } catch (_e) {
        const e = _e;
        return new Err2(new Neo4jLayerError("Unknown", e.message));
      } finally {
        await session.close();
      }
    },
    deleteNode: async ({ nodeType, nodeId }) => {
      if (!neo4jDriver)
        throw new Error("Neo4jNode.neo4jDriver is not configured");
      const session = neo4jDriver.session();
      try {
        const result = await session.executeWrite(async (tx) => {
          return await tx.run(`
                    MATCH (node:${nodeType} {nodeId: $nodeId})
                    OPTIONAL MATCH (node)-[r]-() 
                    DELETE r, node 
                    RETURN node
                    `, { nodeId });
        }).then(({ records }) => records.length ? records.map((record) => record.get("node").properties)[0] : null);
        if (!result)
          return new Err2(new Neo4jLayerError("NodeNotFound", `Node of type ${nodeType} with nodeId: ${nodeId} not found`));
        return new Ok2(result);
      } catch (_e) {
        const e = _e;
        return new Err2(new Neo4jLayerError("Unknown", e.message));
      } finally {
        await session.close();
      }
    },
    createRelationship: async (fromNode, relationshipType, toNode, ...[state]) => {
      if (!neo4jDriver)
        throw new Error("Neo4jNode.neo4jDriver is not configured");
      const session = neo4jDriver.session();
      try {
        const result = await session.executeWrite(async (tx) => {
          return await tx.run(`
                        MATCH (fromNode:${fromNode.nodeType} {nodeId: $fromNode.nodeId})
                        MATCH (toNode:${toNode.nodeType} {nodeId: $toNode.nodeId})
                        MERGE (fromNode)-[relationship:${relationshipType}]->(toNode)
                        SET relationship += $state
                        RETURN fromNode, toNode, relationship
                    `, { fromNode, toNode, state: state ?? {} });
        }).then(({ records }) => records.map((record) => {
          return {
            fromNode: record.get("fromNode").properties,
            relationship: record.get("relationship").properties,
            toNode: record.get("toNode").properties
          };
        })[0]);
        return new Ok2(result);
      } catch (_e) {
        const e = _e;
        return new Err2(new Neo4jLayerError("Unknown", e.message));
      } finally {
        await session.close();
      }
    },
    getRelatedTo: async (fromNode, relationshipType, toNodeType) => {
      if (!neo4jDriver)
        throw new Error("Neo4jNode.neo4jDriver is not configured");
      const session = neo4jDriver.session();
      try {
        const { nodeType, nodeId } = fromNode;
        const result = await session.executeRead(async (tx) => {
          return await tx.run(`
                        MATCH (fromNode:${nodeType} {nodeId: $fromNodeId})-[:${relationshipType}]->(toNode:${toNodeType})
                        RETURN toNode
                    `, { fromNodeId: nodeId });
        }).then(({ records }) => records.map((record) => record.get("toNode").properties));
        return new Ok2(result);
      } catch (_e) {
        const e = _e;
        return new Err2(new Neo4jLayerError("Unknown", e.message));
      } finally {
        await session.close();
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
      const nodeResult = await graph.updateNode({ nodeType, nodeId }, state);
      if (!nodeResult.ok) {
        return nodeResult;
      }
      graph.uniqueIndexes[nodeType].map((indexKey) => `${nodeType}-${indexKey}-${nodeResult.val[indexKey]}`).forEach(revalidateTag);
      return nodeResult;
    }
  };
};
export {
  Neo4jLayer,
  NextjsCacheLayer,
  defineGraph,
  defineNode
};
