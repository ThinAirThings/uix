"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  Neo4jLayer: () => Neo4jLayer,
  NextjsCacheLayer: () => NextjsCacheLayer,
  defineGraph: () => defineGraph,
  defineNode: () => defineNode
});
module.exports = __toCommonJS(src_exports);

// src/base/defineGraph.ts
var import_uuid = require("uuid");
var import_ts_results = require("ts-results");
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
        nodeId: (0, import_uuid.v4)(),
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        ...initialState
      };
      return new import_ts_results.Ok(node);
    },
    getDefinition: (nodeType) => {
      return definitionMap.get(nodeType);
    },
    getNodeType: (nodeType) => null
  };
};

// src/base/defineNode.ts
var defineNode = (nodeType, stateDefinition) => ({
  nodeType,
  stateDefinition
});

// src/layers/Neo4j/Neo4jLayer.ts
var import_neo4j_driver = __toESM(require("neo4j-driver"), 1);

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
var import_ts_results2 = require("ts-results");
var Neo4jLayer = (graph, config) => {
  const neo4jDriver = import_neo4j_driver.default.driver(config.connection.uri, import_neo4j_driver.default.auth.basic(
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
        return new import_ts_results2.Ok(result);
      } catch (_e) {
        const e = _e;
        if (e.message === "Neo.ClientError.Schema.ConstraintValidationFailed") {
          return new import_ts_results2.Err(new Neo4jLayerError("UniqueIndexViolation", e.message));
        }
        return new import_ts_results2.Err(new Neo4jLayerError("Unknown", e.message));
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
          return new import_ts_results2.Err(new Neo4jLayerError("NodeNotFound", `Node of type ${nodeType} with ${nodeIndex} ${indexKey} not found`));
        return new import_ts_results2.Ok(result);
      } catch (_e) {
        const e = _e;
        return new import_ts_results2.Err(new Neo4jLayerError("NodeNotFound", e.message));
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
        return new import_ts_results2.Ok(result);
      } catch (_e) {
        const e = _e;
        return new import_ts_results2.Err(new Neo4jLayerError("Unknown", e.message));
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
          return new import_ts_results2.Err(new Neo4jLayerError("NodeNotFound", `Node of type ${nodeType} with nodeId: ${nodeId} not found`));
        return new import_ts_results2.Ok(result);
      } catch (_e) {
        const e = _e;
        return new import_ts_results2.Err(new Neo4jLayerError("Unknown", e.message));
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
        return new import_ts_results2.Ok(result);
      } catch (_e) {
        const e = _e;
        return new import_ts_results2.Err(new Neo4jLayerError("Unknown", e.message));
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
        return new import_ts_results2.Ok(result);
      } catch (_e) {
        const e = _e;
        return new import_ts_results2.Err(new Neo4jLayerError("Unknown", e.message));
      } finally {
        await session.close();
      }
    }
  };
};

// src/layers/NextjsCache/NextjsCacheLayer.ts
var import_cache = require("next/cache");
var NextjsCacheLayer = (graph) => {
  const cacheMap = /* @__PURE__ */ new Map();
  return {
    ...graph,
    getNode: async (nodeType, nodeIndex, indexKey) => {
      const cacheKey = `${nodeType}-${nodeIndex}-${indexKey}`;
      if (!cacheMap.has(cacheKey)) {
        cacheMap.set(cacheKey, (0, import_cache.unstable_cache)(
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
      graph.uniqueIndexes[nodeType].map((indexKey) => `${nodeType}-${indexKey}-${nodeResult.val[indexKey]}`).forEach(import_cache.revalidateTag);
      return nodeResult;
    }
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Neo4jLayer,
  NextjsCacheLayer,
  defineGraph,
  defineNode
});
