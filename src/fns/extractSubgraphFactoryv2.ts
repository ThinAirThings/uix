import dedent from "dedent";
import { neo4jAction } from "../clients/neo4j";
import { AnyNodeDefinitionMap, NodeDefinitionMap } from "../definitions/NodeDefinition";
import { AnySubgraphDefinition, GenericSubgraphDefinition, SubgraphDefinition } from "../definitions/SubgraphDefinition";
import { Ok } from "../types/Result";
import { GenericSubgraphNodeDefinition, SubgraphNodeDefinition } from "../definitions/SubgraphNodeDefinition";






export const extractSubgraphFactoryv2 = <
    NodeDefinitionMap extends AnyNodeDefinitionMap,
>(
    nodeDefinitionMap: NodeDefinitionMap
) => neo4jAction(async <
    RootNodeType extends keyof NodeDefinitionMap,
    SubgraphIndex extends ({
        [UniqueIndex in NodeDefinitionMap[RootNodeType]['uniqueIndexes'][number]]?: string
    }),
    SubgraphDefinitionRef extends AnySubgraphDefinition
>(
    rootNode: (({
        nodeType: RootNodeType
    }) & SubgraphIndex),
    defineSubgraph: (subgraph: SubgraphDefinition<
        NodeDefinitionMap, 
        [SubgraphNodeDefinition<
            NodeDefinitionMap,
            RootNodeType,
            []
        >]>
    ) => SubgraphDefinitionRef
) => {
    // Begin extraction
    const subgraph = defineSubgraph(new SubgraphDefinition(
        nodeDefinitionMap,
        [new SubgraphNodeDefinition(
            rootNode.nodeType,
            []
        )]
    )) as GenericSubgraphDefinition
    const rootVariable = `n_t${rootNode.nodeType as string}`
    console.log(JSON.stringify(subgraph.subgraphNodeDefinitionMap, null, 2))
    let variableList = [rootVariable]
    const subgraphRootRelationshipSet = subgraph.subgraphNodeDefinitionMap[rootNode.nodeType].subgraphRelationshipSet
    let queryString = dedent/*cypher*/`
        optional match (${rootVariable}:${rootNode.nodeType} {
            ${Object.entries(rootNode).map(([key, value]) => `${key}: "${value as string}"`).join(', ')}
        })${subgraphRootRelationshipSet.length 
            ? subgraphRootRelationshipSet.map(relationship => {
                return relationship
            }).join()
            : ''
        } 
    `
    // queryString += subgraph.nodeDefinitionSet.map((nodeDefinition: GenericSubgraphNodeDefinition) => {
    //     nodeDefinition.subgraphRelationshipSet.map
    // })
    return Ok(queryString as unknown as SubgraphIndex) 
})