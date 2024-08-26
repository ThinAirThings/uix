import dedent from "dedent";
import { neo4jAction, neo4jDriver } from "../clients/neo4j";
import { AnyNodeDefinitionMap, GenericNodeShape, NodeDefinitionMap, NodeShape } from "../definitions/NodeDefinition";
import { AnySubgraphDefinition, GenericSubgraphDefinition, SubgraphDefinition } from "../definitions/SubgraphDefinition";
import { Ok, UixErr } from "../types/Result";
import { SubgraphPathDefinition } from "../definitions/SubgraphPathDefinition";
import {  GenericRelationshipShape, RelationshipState } from "../definitions/RelationshipDefinition";
import { EagerResult, Integer, Node, Path, PathSegment, Relationship } from "neo4j-driver";
import { ExtractOutputTree } from "../types/ExtractOutputTree";
import _ from "lodash";



export const extractSubgraphFactory = <
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
    subgraphArg?: ((subgraph: SubgraphDefinition<
        NodeDefinitionMap, 
        [SubgraphPathDefinition<
            NodeDefinitionMap,
            RootNodeType,
            []
        >]>
    ) => SubgraphDefinitionRef) | SubgraphDefinitionRef
) => {
    // Begin extraction
    const subgraph = ((subgraphArg instanceof Function ? subgraphArg(new SubgraphDefinition(
        nodeDefinitionMap,
        [new SubgraphPathDefinition(
            nodeDefinitionMap,
            rootNode.nodeType,
            []
        )]
    )) : subgraphArg) ?? new SubgraphDefinition(
        nodeDefinitionMap,
        [new SubgraphPathDefinition(
            nodeDefinitionMap,
            rootNode.nodeType,
            []
        )]
    )) as GenericSubgraphDefinition
    const rootVariable = `n_0`
    let variableList = [rootVariable]    
    let queryString = dedent/*cypher*/`
        match (${rootVariable}:${rootNode.nodeType} {
            ${nodeDefinitionMap[rootNode.nodeType]!.uniqueIndexes
                .filter((index:string) => !!rootNode[index as keyof typeof rootNode])
                .map((index: any) => `${index}: "${rootNode[index as keyof typeof rootNode]}"`).join(', ')
            }
        })\n
    `
    
    const buildTree = (subgraph: GenericSubgraphDefinition, pathSegment: string, indexedPath: string, pathIdx: string) => {
        const pathLength = pathSegment.split('-').length
        const nextPathSet = subgraph.pathDefinitionSet
            .filter(path => path.pathType.startsWith(pathSegment) 
                && path.pathType.split('-').length === pathLength + 2
            )
        nextPathSet.forEach((nextPath, branchIdx) => {
            const nextPathIdx = `${pathIdx}_${branchIdx}`
            const nextPathSegments = nextPath.pathType.split('-')
            const rightEndcap = nextPath.pathType.replace(pathSegment, '')[0] === '<' ? '-' : '->'
            const leftEndcap = nextPath.pathType.replace(pathSegment, '')[0] === '<' ? '<-' : '-'
            const newVariables = [`p_${nextPathIdx}`, `r_${nextPathIdx}`, `n_${nextPathIdx}`]
            const nextIndexedPath = dedent/*cypher*/`
                ${indexedPath}${leftEndcap}[${newVariables[1]}:${
                    nextPathSegments.slice(nextPathSegments.length - 2, nextPathSegments.length - 1)
                }]${rightEndcap}(${newVariables[2]}:${nextPathSegments[nextPathSegments.length - 1].replace('>', '')})
            `
            const filterSet = !_.isEmpty(nextPath.options) && Object.entries(nextPath.options).map(([propertyKey, filter]) => 
                filter && Object.entries(filter).map(([filterKey, filterValue]) =>
                    filterValue && 
                    (filterKey === 'equals' && dedent/*cypher*/`${propertyKey.startsWith('rel_') ? newVariables[1] : newVariables[2]}.${propertyKey.replace('rel_', '')} = "${filterValue}"`)
            )).flat().filter(Boolean)
            variableList.push(...newVariables)
            const orderString = !_.isEmpty(nextPath.options) && Object.entries(nextPath.options).map(([propertyKey, filter]) =>
                filter && Object.entries(filter).map(([filterKey, filterValue]) =>
                    filterValue && 
                    (filterKey === 'orderBy' && dedent/*cypher*/`
                        with ${variableList.join(', ')}
                        order by ${propertyKey.startsWith('rel_') ? newVariables[1] : newVariables[2]}.${propertyKey.replace('rel_', '')} ${filterValue}
                    `)
            )).flat().filter(Boolean)

            queryString += dedent/*cypher*/`
                optional match ${newVariables[0]} = ${nextIndexedPath}
                ${(filterSet && filterSet.length) ? `where ${filterSet.join(" AND ")}` : ''}
                ${orderString ? orderString.join('\n') : ''}
                \n
            `
            
            buildTree(subgraph, nextPath.pathType, nextIndexedPath, nextPathIdx)
        })
    }
    buildTree(subgraph, rootNode.nodeType as string, `(${rootVariable})`, '0')
    const pathVariableList = variableList.filter(v => v.includes('p'))
    queryString += dedent/*cypher*/`
        with n_0 ${pathVariableList.length ? `, ${pathVariableList.map((path, idx) => `collect(${path}) as p_${idx}`).join(', ')}` : ''}
        return n_0 ${pathVariableList.length ? `, ${pathVariableList.map((_, idx) => `p_${idx}`).join('+')} as pathSet` : ''}
    `
    
    const resultTree = await neo4jDriver().executeQuery<EagerResult<{
        pathSet: Path<Integer>[]
        n_0: Node<Integer, GenericNodeShape>
    }>>(queryString).then(result => {
        const records = result.records
        type TreeNode = GenericNodeShape & RelationshipState<any> & {
            [r:string]: {
                [id: string]: GenericNodeShape
            }
        }
        const rootNodeRef = records?.[0]?.get(rootVariable)?.properties as TreeNode
        const pathSet = records?.[0]?.has('pathSet') && records[0].get('pathSet') as Path<Integer>[]
        if (!rootNodeRef) return null
        if (!pathSet) return rootNodeRef
        pathSet.forEach((path) => {
            const buildTree = (node: TreeNode, pathSegment: PathSegment<Integer> | undefined) => {
                if(!pathSegment) return node
                const relationship = pathSegment.relationship as Relationship<Integer, GenericRelationshipShape>
                const rightEndcap = relationship.start === pathSegment.start.identity  ? '->' : '-'
                const leftEndcap = relationship.start === pathSegment.end.identity ? '<-' : '-'
                const nextNode = pathSegment.end.properties as GenericNodeShape
                const relationshipKey = `${leftEndcap}${relationship.type}${rightEndcap}${nextNode.nodeType}`
                if (!node[relationshipKey]) node[relationshipKey] = {}
                node[relationshipKey][nextNode.nodeId] = node[relationshipKey][nextNode.nodeId] ?? {
                    fromNodeId: node.nodeId,
                    fromNodeType: node.nodeType,
                    ...relationship.properties,
                    ...nextNode,
                }
                return buildTree(node[relationshipKey][nextNode.nodeId] as TreeNode, path.segments.shift())
            }
            buildTree(rootNodeRef, path.segments.shift())
        })

        return rootNodeRef
    })
    if (process.env.TEST_ENV === "true") {
        const fs = require('fs')
        fs.writeFileSync('tests/extract:queryString.cypher', queryString)
        fs.writeFileSync('tests/extract:resultTree.json', JSON.stringify(resultTree, null, 2))
    }
    if (!resultTree) return UixErr({
        subtype: 'ExpectedRuntimeError',
        message: "The root node requested was not found. This is likely due to it not existing in the database.",
        data: {
            rootNode: rootNode,
        }
    })
    return Ok(resultTree as ExtractOutputTree<NodeDefinitionMap, SubgraphDefinitionRef, RootNodeType>)
})



