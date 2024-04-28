// src/base/defineBaseGraph.ts
import { v4 as uuidv4 } from "uuid";
import { Ok } from "ts-results";
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
        nodeId: uuidv4(),
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        ...initialState
      };
      return new Ok(node);
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
import neo4j from "neo4j-driver";

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

// src/layers/Neo4j/defineNeo4jLayer.ts
import { Ok as Ok2, Err } from "ts-results";

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
  const neo4jDriver = neo4j.driver(config.connection.uri, neo4j.auth.basic(
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
        return new Ok2({ nodeType: result.nodeType, nodeId: result.nodeId });
      } catch (_e) {
        const e = _e;
        if (e.message === "Neo.ClientError.Schema.ConstraintValidationFailed") {
          return new Err(UixErr("Neo4j", "Normal", "UniqueIndexViolation", { message: e.message }));
        }
        return new Err(UixErr("Neo4j", "Fatal", "LayerImplementationError", { message: e.message }));
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
          return new Err(UixErr("Neo4j", "Normal", "NodeNotFound", { message: `Node of type ${nodeType} with ${nodeIndex} ${indexKey} not found` }));
        return new Ok2(result);
      } catch (_e) {
        const e = _e;
        return new Err(UixErr("Neo4j", "Fatal", "LayerImplementationError", { message: e.message }));
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
        return new Err(UixErr("Neo4j", "Fatal", "LayerImplementationError", { message: e.message }));
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
          return new Err(UixErr("Neo4j", "Normal", "NodeNotFound", { message: `Node of type ${nodeType} with nodeId: ${nodeId} not found` }));
        return new Ok2(null);
      } catch (_e) {
        const e = _e;
        return new Err(UixErr("Neo4j", "Fatal", "LayerImplementationError", { message: e.message }));
      } finally {
        await session.close();
      }
    },
    createRelationship: async (fromNode, relationshipType, toNode, ...[state]) => {
      if (fromNode instanceof Err)
        return fromNode;
      if (fromNode instanceof Ok2)
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
            return new Err(UixErr("Neo4j", "Normal", "LayerImplementationError", { message: `Relationship of type ${relationshipType} from node ${fromNode.nodeType} to node ${toNode.nodeType} already exists` }));
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
        return new Ok2({
          fromNodeKey: {
            nodeType: executeWriteResult.fromNode.nodeType,
            nodeId: executeWriteResult.fromNode.nodeId
          },
          relationship: executeWriteResult.relationship,
          toNodeKey: {
            nodeType: executeWriteResult.toNode.nodeType,
            nodeId: executeWriteResult.toNode.nodeId
          }
        });
      } catch (_e) {
        const e = _e;
        return new Err(UixErr("Neo4j", "Fatal", "LayerImplementationError", { message: e.message }));
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
        const uniqueRelationship = relationshipDictionary[relationshipType].uniqueFromNode;
        const result = await session.executeRead(async (tx) => {
          return await tx.run(`
                        MATCH (fromNode:${nodeType} {nodeId: $fromNodeId})-[:${relationshipType}]->(toNode:${toNodeType})
                        RETURN toNode
                    `, { fromNodeId: nodeId });
        }).then(
          ({ records }) => (
            // records.map(record => record.get('toNode').properties)
            uniqueRelationship === true ? records.length ? records.map((record) => record.get("toNode").properties)[0] : null : records.map((record) => record.get("toNode").properties)
          )
        );
        if (!result)
          return new Err(UixErr("Neo4j", "Normal", "NodeNotFound", { message: `Node of type ${toNodeType} related to ${nodeType} with nodeId: ${nodeId} not found` }));
        return new Ok2(result);
      } catch (_e) {
        const e = _e;
        return new Err(UixErr("Neo4j", "Fatal", "LayerImplementationError", { message: e.message }));
      } finally {
        await session.close();
      }
    }
  };
  return thisGraphLayer;
};

// src/layers/NextjsCache/defineNextjsCacheLayer.ts
import { unstable_cache as cache, revalidateTag } from "next/cache";
import { Err as Err2, Ok as Ok3 } from "ts-results";
var defineNextjsCacheLayer = (graph) => {
  const cacheMap = /* @__PURE__ */ new Map();
  const invalidationFnKeys = ["getNode", "getRelatedTo"];
  const invalidateCacheKeys = (node) => {
    const uniqueIndexes = ["nodeId", ...graph.uniqueIndexes[node.nodeType] ?? []];
    const cacheKeys = uniqueIndexes.map((index) => invalidationFnKeys.map((fnKey) => `${fnKey}-${node.nodeType}-${index}-${node[index]}`)).flat();
    cacheKeys.forEach((cacheKey) => {
      revalidateTag(cacheKey);
    });
  };
  return {
    ...graph,
    // Get node has an explicit cache key
    getNode: async (nodeType, nodeIndex, indexKey) => {
      const cacheKey = `getNode-${nodeType}-${nodeIndex}-${indexKey}`;
      !cacheMap.has(cacheKey) && cacheMap.set(cacheKey, cache(
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
    getRelatedTo: async (fromNode, relationshipType, toNodeType) => {
      const cacheKey = `getRelatedTo-${fromNode.nodeId}-${relationshipType}-${toNodeType}`;
      if (!cacheMap.has(cacheKey)) {
        cacheMap.set(cacheKey, cache(async (...args) => {
          return await graph.getRelatedTo(...args);
        }, [cacheKey], {
          tags: [cacheKey]
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
      const getNodeResult = await graph.getNode(nodeType, "nodeId", createNodeResult.val.nodeId);
      if (!getNodeResult.ok)
        return getNodeResult;
      const node = getNodeResult.val;
      invalidateCacheKeys(node);
      return new Ok3({ nodeType: node.nodeType, nodeId: node.nodeId });
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
      if (!getNodeResult.ok) {
        if (getNodeResult.val.subtype === "NodeNotFound") {
          return new Ok3(null);
        }
        return getNodeResult;
      }
      const node = getNodeResult.val;
      const nodeResult = await graph.deleteNode(nodeKey);
      invalidateCacheKeys(node);
      if (!nodeResult.ok)
        return nodeResult;
      return nodeResult;
    },
    createRelationship: async (fromNode, relationshipType, toNode, ...args) => {
      if (fromNode instanceof Err2)
        return fromNode;
      if (fromNode instanceof Ok3)
        fromNode = fromNode.val;
      const createRelationshipResult = await graph.createRelationship(fromNode, relationshipType, toNode, ...args);
      if (!createRelationshipResult.ok) {
        return createRelationshipResult;
      }
      const cacheKey = `getRelatedTo-${fromNode.nodeId}-${relationshipType}-${toNode.nodeType}`;
      revalidateTag(cacheKey);
      return createRelationshipResult;
    }
  };
};
export {
  defineBaseGraph,
  defineNeo4jLayer,
  defineNextjsCacheLayer,
  defineNode
};
