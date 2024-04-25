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
        nodeId: (0, import_uuid.v4)(),
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
var import_neo4j_driver = __toESM(require("neo4j-driver"), 1);

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
  const neo4jDriver = import_neo4j_driver.default.driver(config.connection.uri, import_neo4j_driver.default.auth.basic(
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
        return await session.executeRead(async (tx) => {
          return await tx.run(`
                        MATCH (n:${nodeType} {${nodeIndex}: $indexKey})
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
var import_cache = require("next/cache");
var NextjsCacheLayer = (graph) => {
  const cacheMap = /* @__PURE__ */ new Map();
  const uniqueIndexes = graph["uniqueIndexes"];
  return {
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
      const node = await graph.updateNode({ nodeType, nodeId }, state);
      uniqueIndexes[nodeType].map((indexKey) => `${nodeType}-${indexKey}-${node[indexKey]}`).forEach(import_cache.revalidateTag);
      return node;
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
