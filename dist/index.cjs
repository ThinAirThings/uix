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
  Err: () => Err,
  Ok: () => Ok,
  defineBaseGraph: () => defineBaseGraph,
  defineNeo4jLayer: () => defineNeo4jLayer,
  defineNextjsCacheLayer: () => defineNextjsCacheLayer,
  defineNode: () => defineNode,
  defineReactCacheLayer: () => defineReactCacheLayer
});
module.exports = __toCommonJS(src_exports);

// src/base/defineBaseGraph.ts
var import_uuid = require("uuid");

// src/types/Result.ts
var Ok = (val) => ({
  ok: true,
  val
});
var Err = (val) => ({
  ok: false,
  val
});

// src/base/defineBaseGraph.ts
var defineBaseGraph = ({
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
      return Ok(node);
    },
    getNodeDefinition: (nodeType) => {
      return definitionMap.get(nodeType);
    }
  };
};

// src/base/defineNode.ts
var defineNode = (nodeType, stateDefinition) => ({
  nodeType,
  stateDefinition
});

// src/layers/Neo4j/defineNeo4jLayer.ts
var import_neo4j_driver = __toESM(require("neo4j-driver"), 1);

// src/layers/Neo4j/createUniqueIndex.ts
var createUniqueIndex = async (neo4jDriver, nodeType, propertyName) => {
  const neo4jSession = neo4jDriver.session();
  try {
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

// src/base/UixErr.ts
var ExtendUixError = () => (layer, type, subtype, opts) => ({
  layer,
  type,
  subtype,
  ...opts
});

// src/layers/Neo4j/defineNeo4jLayer.ts
var defineNeo4jLayer = (graph, config) => {
  const UixErr = ExtendUixError();
  const neo4jDriver = import_neo4j_driver.default.driver(config.connection.uri, import_neo4j_driver.default.auth.basic(
    config.connection.username,
    config.connection.password
  ));
  const uniqueIndexes = graph.uniqueIndexes;
  const uniqueIndexesCreated = [
    ...graph.nodeDefinitions.map(async ({ nodeType }) => createUniqueIndex(neo4jDriver, nodeType, "nodeId")),
    ...(uniqueIndexes && Object.entries(uniqueIndexes).map(async ([nodeType, _indexes]) => {
      const indexes = _indexes;
      return await Promise.all(indexes.map(async (index) => await createUniqueIndex(neo4jDriver, nodeType, index)));
    })) ?? []
  ];
  const relationshipDictionary = Object.fromEntries(
    graph.relationshipDefinitions.map(({
      relationshipType,
      stateDefinition,
      uniqueFromNode
    }) => [relationshipType, { stateDefinition, uniqueFromNode }])
  );
  const thisGraphLayer = {
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
        return Ok(result);
      } catch (_e) {
        const e = _e;
        if (e.message === "Neo.ClientError.Schema.ConstraintValidationFailed") {
          return Err(UixErr("Neo4j", "Normal", "UniqueIndexViolation", { message: e.message }));
        }
        return Err(UixErr("Neo4j", "Fatal", "LayerImplementationError", { message: e.message }));
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
          return Err(UixErr("Neo4j", "Normal", "NodeNotFound", { message: `Node of type ${nodeType} with ${nodeIndex} ${indexKey} not found` }));
        return Ok(result);
      } catch (_e) {
        const e = _e;
        return Err(UixErr("Neo4j", "Fatal", "LayerImplementationError", { message: e.message }));
      } finally {
        session.close();
      }
    },
    getNodeType: async (nodeType) => {
      if (!neo4jDriver)
        throw new Error("Neo4jNode.neo4jDriver is not configured");
      const session = neo4jDriver.session();
      try {
        const result = await session.executeRead(async (tx) => {
          return await tx.run(`
                            MATCH (node:${nodeType})
                            RETURN node
                        `);
        }).then(({ records }) => records.map((record) => record.get("node").properties));
        return Ok(result);
      } catch (_e) {
        const e = _e;
        return Err(UixErr("Neo4j", "Fatal", "LayerImplementationError", { message: e.message }));
      } finally {
        session.close();
      }
    },
    updateNode: async ({ nodeType, nodeId }, state) => {
      if (!neo4jDriver)
        throw new Error("Neo4jNode.neo4jDriver is not configured");
      const session = neo4jDriver.session();
      const stateKeys = Object.keys(state);
      const stateDefinitionKeys = Object.keys(graph.getNodeDefinition(nodeType).stateDefinition.shape);
      const stateKeysNotInDefinition = stateKeys.filter((key) => !stateDefinitionKeys.includes(key));
      stateKeysNotInDefinition.forEach((key) => delete state[key]);
      try {
        const result = await session.executeWrite(async (tx) => {
          return await tx.run(`
                        MATCH (node:${nodeType} {nodeId: $nodeId})
                        SET node += $state
                        RETURN node
                    `, { nodeId, state });
        }).then(({ records }) => records.map((record) => record.get("node").properties)[0]);
        return Ok(result);
      } catch (_e) {
        const e = _e;
        return Err(UixErr("Neo4j", "Fatal", "LayerImplementationError", { message: e.message }));
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
        return Ok(null);
      } catch (_e) {
        const e = _e;
        return Err(UixErr("Neo4j", "Fatal", "LayerImplementationError", { message: e.message }));
      } finally {
        await session.close();
      }
    },
    createRelationship: async (fromNode, relationshipType, toNode, ...[state]) => {
      if ("ok" in fromNode && !fromNode.ok)
        return fromNode;
      if ("ok" in fromNode && fromNode.ok)
        fromNode = fromNode.val;
      if (!neo4jDriver)
        throw new Error("Neo4jNode.neo4jDriver is not configured");
      const session = neo4jDriver.session();
      try {
        if (relationshipDictionary[relationshipType].uniqueFromNode) {
          const result = await session.executeRead(async (tx) => {
            return await tx.run(`
                            MATCH (fromNode:${fromNode.nodeType} {nodeId: $fromNode.nodeId})-[relationship:${relationshipType}]->(toNode:${toNode.nodeType})
                            RETURN relationship
                        `, { fromNode, toNode });
          }).then(({ records }) => records.length ? records.map((record) => record.get("relationship").properties)[0] : null);
          if (result) {
            return Err(UixErr("Neo4j", "Normal", "LayerImplementationError", { message: `Relationship of type ${relationshipType} from node ${fromNode.nodeType} to node ${toNode.nodeType} already exists` }));
          }
        }
        if ("nodeId" in toNode) {
          toNode = toNode;
        } else {
          const toNodeKeyOrResult = await thisGraphLayer.createNode(toNode.nodeType, toNode.initialState);
          if (!toNodeKeyOrResult.ok)
            return toNodeKeyOrResult;
          toNode = toNodeKeyOrResult.val;
        }
        const executeWriteResult = await session.executeWrite(async (tx) => {
          const txRes = await tx.run(`
                        MATCH (fromNode:${fromNode.nodeType} {nodeId: $fromNode.nodeId})
                        MATCH (toNode:${toNode.nodeType} {nodeId: $toNode.nodeId})
                        MERGE (fromNode)-[relationship:${relationshipType}]->(toNode)
                        SET relationship += $state
                        RETURN fromNode, toNode, relationship
                    `, { fromNode, toNode, state: state ?? {} });
          return txRes;
        }).then(({ records }) => records.map((record) => {
          return {
            fromNode: record.get("fromNode").properties,
            relationship: record.get("relationship").properties,
            toNode: record.get("toNode").properties
          };
        })[0]);
        return Ok({
          fromNode: executeWriteResult.fromNode,
          relationship: executeWriteResult.relationship,
          toNode: executeWriteResult.toNode
        });
      } catch (_e) {
        const e = _e;
        return Err(UixErr("Neo4j", "Fatal", "LayerImplementationError", { message: e.message }));
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
        }).then(
          ({ records }) => relationshipDictionary[relationshipType].uniqueFromNode ? records.length ? records.map((record) => record.get("toNode").properties)[0] : null : records.map((record) => record.get("toNode").properties)
        );
        return Ok(result);
      } catch (_e) {
        const e = _e;
        return Err(UixErr("Neo4j", "Fatal", "LayerImplementationError", { message: e.message }));
      } finally {
        await session.close();
      }
    }
  };
  return thisGraphLayer;
};

// src/layers/NextjsCache/defineNextjsCacheLayer.ts
var import_cache = require("next/cache");
var defineNextjsCacheLayer = (graph) => {
  const cacheMap = /* @__PURE__ */ new Map();
  const invalidationFnKeys = ["getNode", "getRelatedTo"];
  const invalidateCacheKeys = (node) => {
    const uniqueIndexes = ["nodeId", ...graph.uniqueIndexes[node.nodeType] ?? []];
    const cacheKeys = uniqueIndexes.map((index) => invalidationFnKeys.map((fnKey) => `${fnKey}-${node.nodeType}-${index}-${node[index]}`)).flat();
    cacheKeys.forEach((cacheKey) => {
      (0, import_cache.revalidateTag)(cacheKey);
    });
  };
  return {
    ...graph,
    // Get node has an explicit cache key
    getNode: async (nodeType, nodeIndex, indexKey) => {
      const cacheKey = `getNode-${nodeType}-${nodeIndex}-${indexKey}`;
      !cacheMap.has(cacheKey) && cacheMap.set(cacheKey, (0, import_cache.unstable_cache)(
        async (...[nodeType2, index, key]) => {
          return await graph.getNode(nodeType2, index, key);
        },
        [cacheKey],
        {
          tags: [cacheKey]
        }
      ));
      const node = await cacheMap.get(cacheKey)(nodeType, nodeIndex, indexKey);
      return node;
    },
    getNodeType: async (nodeType) => {
      const cacheKey = `getNodeType-${nodeType}`;
      if (!cacheMap.has(cacheKey)) {
        cacheMap.set(cacheKey, (0, import_cache.unstable_cache)(async (...args) => {
          return await graph.getNodeType(...args);
        }, [cacheKey], {
          tags: [cacheKey]
        }));
      }
      return await cacheMap.get(cacheKey)(nodeType);
    },
    getRelatedTo: async (fromNode, relationshipType, toNodeType) => {
      const cacheKey = `getRelatedTo-${fromNode.nodeId}-${relationshipType}-${toNodeType}`;
      if (!cacheMap.has(cacheKey)) {
        cacheMap.set(cacheKey, (0, import_cache.unstable_cache)(async (...args) => {
          return await graph.getRelatedTo(...args);
        }, [cacheKey], {
          tags: [cacheKey, `getRelatedTo-${toNodeType}`]
        }));
      }
      return await cacheMap.get(cacheKey)(fromNode, relationshipType, toNodeType);
    },
    // Note the NextJs cache layer needs to use modified return types. You need to redefine the Neo4j layer to return nodes and then change the
    // return type here to be NodeKeys.
    // You need this to force the user to use getNode after creation. If you don't, then they could be stuck with a null value after creation.
    createNode: async (nodeType, initialState) => {
      const createNodeResult = await graph.createNode(nodeType, initialState);
      if (!createNodeResult.ok) {
        return createNodeResult;
      }
      const node = createNodeResult.val;
      invalidateCacheKeys(node);
      return Ok({ nodeType: node.nodeType, nodeId: node.nodeId });
    },
    updateNode: async (nodeKey, state) => {
      const updateNodeResult = await graph.updateNode(nodeKey, state);
      if (!updateNodeResult.ok)
        return updateNodeResult;
      const node = updateNodeResult.val;
      invalidateCacheKeys(node);
      return updateNodeResult;
    },
    deleteNode: async (nodeKey) => {
      const getNodeResult = await graph.getNode(nodeKey.nodeType, "nodeId", nodeKey.nodeId);
      const deleteNodeResult = await graph.deleteNode(nodeKey);
      if (!deleteNodeResult.ok)
        return deleteNodeResult;
      if (!getNodeResult.ok)
        return getNodeResult;
      const node = getNodeResult.val;
      invalidateCacheKeys(node);
      (0, import_cache.revalidateTag)(`getRelatedTo-${node.nodeType}`);
      return deleteNodeResult;
    },
    createRelationship: async (fromNode, relationshipType, toNode, ...args) => {
      if ("ok" in fromNode && !fromNode.ok)
        return fromNode;
      if ("ok" in fromNode && fromNode.ok)
        fromNode = fromNode.val;
      const createRelationshipResult = await graph.createRelationship(fromNode, relationshipType, toNode, ...args);
      if (!createRelationshipResult.ok) {
        return createRelationshipResult;
      }
      const cacheKey = `getRelatedTo-${fromNode.nodeId}-${relationshipType}-${toNode.nodeType}`;
      (0, import_cache.revalidateTag)(cacheKey);
      return Ok({
        fromNodeKey: { nodeType: fromNode.nodeType, nodeId: fromNode.nodeId },
        relationship: createRelationshipResult.val.relationship,
        toNodeKey: { nodeType: toNode.nodeType, nodeId: createRelationshipResult.val.toNode.nodeId }
      });
    }
  };
};

// src/layers/ReactCache/defineReactCacheLayer.ts
var import_react_query = require("@tanstack/react-query");
var import_react = require("react");
var defineReactCacheLayer = (graph) => {
  const queryClient = new import_react_query.QueryClient();
  const invalidateCacheKeys = (node) => {
    const uniqueIndexes = ["nodeId", ...graph.uniqueIndexes[node.nodeType] ?? []];
    const cacheKeys = uniqueIndexes.map((index) => [node.nodeType, index, node[index]]);
    cacheKeys.forEach((cacheKey) => queryClient.invalidateQueries({
      queryKey: cacheKey
    }));
  };
  return {
    ...graph,
    useNode: (nodeType, nodeIndex, indexKey, selector) => {
      return (0, import_react_query.useQuery)({
        queryKey: [nodeType, nodeIndex, indexKey],
        queryFn: async () => {
          const getNodeResult = await graph.getNode(nodeType, nodeIndex, indexKey);
          if (!getNodeResult.ok)
            throw new Error(getNodeResult.val.message);
          return getNodeResult.val;
        },
        select: selector ? (0, import_react.useCallback)(selector, []) : void 0
      }, queryClient);
    },
    // useRelatedTo: (fromNode, relationshipType, toNodeType) => useQuery({
    //     queryKey: [fromNode, relationshipType, toNodeType],
    //     queryFn: async () => {
    //         return await graph.getRelatedTo(fromNode, relationshipType, toNodeType)
    //     }
    // }),
    // You need this to force the user to use getNode after creation. If you don't, then they could be stuck with a null value after creation.
    createNode: async (nodeType, initialState) => {
      const createNodeResult = await graph.createNode(nodeType, initialState);
      if (!createNodeResult.ok)
        return createNodeResult;
      const node = createNodeResult.val;
      invalidateCacheKeys(node);
      return Ok(node);
    },
    updateNode: async (nodeKey, state) => {
      const updateNodeResult = await graph.updateNode(nodeKey, state);
      if (!updateNodeResult.ok)
        return updateNodeResult;
      const node = updateNodeResult.val;
      invalidateCacheKeys(node);
      return updateNodeResult;
    },
    deleteNode: async (nodeKey) => {
      const getNodeResult = await graph.getNode(nodeKey.nodeType, "nodeId", nodeKey.nodeId);
      const deleteNodeResult = await graph.deleteNode(nodeKey);
      if (!deleteNodeResult.ok)
        return deleteNodeResult;
      if (!getNodeResult.ok)
        return deleteNodeResult;
      const node = getNodeResult.val;
      if (!node)
        return deleteNodeResult;
      invalidateCacheKeys(node);
      return deleteNodeResult;
    },
    createRelationship: async (fromNode, relationshipType, toNode, ...args) => {
      if ("ok" in fromNode && !fromNode.ok)
        return fromNode;
      if ("ok" in fromNode && fromNode.ok)
        fromNode = fromNode.val;
      const createRelationshipResult = await graph.createRelationship(fromNode, relationshipType, toNode, ...args);
      if (!createRelationshipResult.ok) {
        return createRelationshipResult;
      }
      const cacheKey = `getRelatedTo-${fromNode.nodeId}-${relationshipType}-${toNode.nodeType}`;
      return createRelationshipResult;
    }
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Err,
  Ok,
  defineBaseGraph,
  defineNeo4jLayer,
  defineNextjsCacheLayer,
  defineNode,
  defineReactCacheLayer
});
