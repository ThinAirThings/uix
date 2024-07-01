import { execSync } from 'child_process'
import { v4 as uuid } from 'uuid'
import { afterAll, expect, test } from 'vitest'
import { AnyErrType, Err, tryCatch, UixErr, UixErrSubtype } from '../src/types/Result'
import { createNode, deleteNode, getAllOfNodeType, getChildNodeSet, getNodeByIndex, getUniqueChildNode, getVectorNodeByKey, updateNode } from './uix/generated/functionModule'
import { throwTestError } from './utils/throwTestError'
import { getTotalNodeCount } from './utils/getTotalNodeCount'
import { createFemaleCollegeElementaryTeacher } from './mocks/createFemaleCollegeElementaryEducator'
import { createFemaleHighSchoolGraduateService } from './mocks/createFemaleHighSchoolGraduateService'
import { createMaleCollegeGraduateMarketing } from './mocks/createMaleCollegeGraduateMarketing'
import { driver, JobNode, UserNode } from './uix/generated/staticObjects'
import { EagerResult, Integer, Node } from 'neo4j-driver'
import dedent from 'dedent'
import { writeFile } from 'fs/promises'
import path from 'path'


let emails: string[] = []
test('Integration test', async () => {
    const { data: uixData, error: uixError } = await tryCatch({
        try: () => execSync('pnpm uix'),
        catch: (e: Error) => Err({
            type: 'TestErr',
            subtype: 'UixError',
            message: e.message,
            data: { e }
        })
    })
    const initialnodeCount = await getTotalNodeCount()
    const [
        femaleCollegeElementaryTeacherNode,
        femaleHighSchoolGraduateServiceNode,
        maleCollegeGraduateMarketingNode
    ] = await Promise.all([
        // Create Node
        createFemaleCollegeElementaryTeacher(),
        createFemaleHighSchoolGraduateService(),
        createMaleCollegeGraduateMarketing()
    ])
    emails.push(femaleCollegeElementaryTeacherNode.email, femaleHighSchoolGraduateServiceNode.email, maleCollegeGraduateMarketingNode.email)
    expect(femaleCollegeElementaryTeacherNode).toBeTruthy()
    expect(femaleHighSchoolGraduateServiceNode).toBeTruthy()
    expect(maleCollegeGraduateMarketingNode).toBeTruthy()
    const matchResults = await driver.executeQuery<EagerResult<{
        femaleCollegeElementaryTeacherNode: Node<Integer, UserNode>,
        femaleCollegeElementaryTeacherJobNodeSet: Node<Integer, JobNode>[]
        femaleHighSchoolGraduateServiceNode: Node<Integer, UserNode>,
        femaleHighSchoolGraduateServiceJobNodeSet: Node<Integer, JobNode>[]
        maleCollegeGraduateMarketingNode: Node<Integer, UserNode>,
        maleCollegeGraduateMarketingJobNodeSet: Node<Integer, JobNode>[]
    }>>(dedent/*cypher*/`
        match (femaleCollegeElementaryTeacherNode: User {nodeId: $femaleCollegeElementaryTeacherNodeId})-[:MATCH_TO]->(femaleCollegeElementaryTeacherJobNode: Job)
        match (femaleHighSchoolGraduateServiceNode: User {nodeId: $femaleHighSchoolGraduateServiceNodeId})-[:MATCH_TO]->(femaleHighSchoolGraduateServiceJobNode: Job)
        match (maleCollegeGraduateMarketingNode: User {nodeId: $maleCollegeGraduateMarketingNodeId})-[:MATCH_TO]->(maleCollegeGraduateMarketingJobNode: Job)
        return 
            femaleCollegeElementaryTeacherNode, 
            collect(distinct femaleCollegeElementaryTeacherJobNode) as femaleCollegeElementaryTeacherJobNodeSet,
            femaleHighSchoolGraduateServiceNode,
            collect(distinct femaleHighSchoolGraduateServiceJobNode) as femaleHighSchoolGraduateServiceJobNodeSet,
            maleCollegeGraduateMarketingNode,
            collect(distinct maleCollegeGraduateMarketingJobNode) as maleCollegeGraduateMarketingJobNodeSet 
    `, {
        femaleCollegeElementaryTeacherNodeId: femaleCollegeElementaryTeacherNode.nodeId,
        femaleHighSchoolGraduateServiceNodeId: femaleHighSchoolGraduateServiceNode.nodeId,
        maleCollegeGraduateMarketingNodeId: maleCollegeGraduateMarketingNode.nodeId
    }).then(res => {
        console.log(res.records)
        return {
            femaleCollegeElementaryTeacherNode: {
                userNode: res.records[0].get('femaleCollegeElementaryTeacherNode').properties,
                jobNode: res.records[0].get('femaleCollegeElementaryTeacherJobNodeSet').map(record => record.properties)
            },
            femaleHighSchoolGraduateServiceNode: {
                userNode: res.records[0].get('femaleHighSchoolGraduateServiceNode').properties,
                jobNode: res.records[0].get('femaleHighSchoolGraduateServiceJobNodeSet').map(record => record.properties)
            },
            maleCollegeGraduateMarketingNode: {
                userNode: res.records[0].get('maleCollegeGraduateMarketingNode').properties,
                jobNode: res.records[0].get('maleCollegeGraduateMarketingJobNodeSet').map(record => record.properties)
            }
        }
    })
    await writeFile(path.resolve('tests', 'matchResults.json'), JSON.stringify(matchResults, null, 2))
    // Cleanup
    Object.values(matchResults).forEach(async ({ userNode }) => {
        await deleteNode(userNode)
    })
    const finalNodeCount = await getTotalNodeCount()
    expect(finalNodeCount).toBe(initialnodeCount)
})

afterAll(async () => {
    await Promise.all(emails.map(async email => {
        const { data } = await getNodeByIndex('User', 'email', email)
        if (data) {
            await deleteNode(data)
        }
    }))
})