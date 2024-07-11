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
import { JobNode, UserNode } from './uix/generated/staticObjects'
import { driver } from './uix/generated/clients'
import { EagerResult, Integer, Node } from 'neo4j-driver'
import dedent from 'dedent'
import { writeFile } from 'fs/promises'
import path from 'path'


let emails: string[] = []
function pick(obj, keys) {
    return keys.reduce((result, key) => {
        if (obj.hasOwnProperty(key)) {
            result[key] = obj[key];
        }
        return result;
    }, {});
}

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
        femaleCollegeElementaryTeacherJobNodeSet: { job: Node<Integer, JobNode>, score: number }[]
    }>>(dedent/*cypher*/`
        match (femaleCollegeElementaryTeacherNode: User {nodeId: $femaleCollegeElementaryTeacherNodeId})-[female_college_match_to:MATCH_TO]->(femaleCollegeElementaryTeacherJobNode: Job)
        return 
            femaleCollegeElementaryTeacherNode, 
            COLLECT({job: femaleCollegeElementaryTeacherJobNode, score: female_college_match_to.score}) AS femaleCollegeElementaryTeacherJobNodeSet
    `, {
        femaleCollegeElementaryTeacherNodeId: femaleCollegeElementaryTeacherNode.nodeId,
    }).then(res => {
        const selectedProperties = [
            'title',
            'companyName',
            'description',
            'skills',
            'educationRequired',
            'workLocationType',
            'companyOverview'
        ];

        function pick(obj, keys) {
            return keys.reduce((result, key) => {
                if (obj.hasOwnProperty(key)) {
                    result[key] = obj[key];
                }
                return result;
            }, {});
        }

        function extractAndSortJobs(record, jobNodeSetKey) {
            return record.get(jobNodeSetKey)
                .map(({ job, score }) => ({
                    ...pick(job.properties, selectedProperties),
                    score
                }))
                .sort((a, b) => b.score - a.score);
        }
        return {
            femaleCollegeElementaryTeacherNode: {
                userNode: res.records[0].get('femaleCollegeElementaryTeacherNode').properties,
                jobNode: extractAndSortJobs(res.records[0], 'femaleCollegeElementaryTeacherJobNodeSet')
            },
        };
    })
    const matchResultsMarketing = await driver.executeQuery<EagerResult<{
        femaleCollegeElementaryTeacherNode: Node<Integer, UserNode>,
        femaleCollegeElementaryTeacherJobNodeSet: { job: Node<Integer, JobNode>, score: number }[]
    }>>(dedent/*cypher*/`
        match (femaleCollegeElementaryTeacherNode: User {nodeId: $femaleCollegeElementaryTeacherNodeId})-[female_college_match_to:MATCH_TO]->(femaleCollegeElementaryTeacherJobNode: Job)
        return 
            femaleCollegeElementaryTeacherNode, 
            COLLECT({job: femaleCollegeElementaryTeacherJobNode, score: female_college_match_to.score}) AS femaleCollegeElementaryTeacherJobNodeSet
    `, {
        femaleCollegeElementaryTeacherNodeId: maleCollegeGraduateMarketingNode.nodeId,
    }).then(res => {
        const selectedProperties = [
            'title',
            'companyName',
            'description',
            'skills',
            'educationRequired',
            'workLocationType',
            'companyOverview'
        ];

        function pick(obj, keys) {
            return keys.reduce((result, key) => {
                if (obj.hasOwnProperty(key)) {
                    result[key] = obj[key];
                }
                return result;
            }, {});
        }

        function extractAndSortJobs(record, jobNodeSetKey) {
            return record.get(jobNodeSetKey)
                .map(({ job, score }) => ({
                    ...pick(job.properties, selectedProperties),
                    score
                }))
                .sort((a, b) => b.score - a.score);
        }
        return {
            femaleCollegeElementaryTeacherNode: {
                userNode: res.records[0].get('femaleCollegeElementaryTeacherNode').properties,
                jobNode: extractAndSortJobs(res.records[0], 'femaleCollegeElementaryTeacherJobNodeSet')
            },
        };
    })
    await writeFile(path.resolve('tests', 'matchResults.json'), JSON.stringify(matchResults, null, 2))
    await writeFile(path.resolve('tests', 'matchResultsMarketing.json'), JSON.stringify(matchResultsMarketing, null, 2))
    // Cleanup
    Object.values(matchResults).forEach(async ({ userNode }) => {
        await deleteNode({ nodeKey: userNode })
    })
    const finalNodeCount = await getTotalNodeCount()
    expect(finalNodeCount).toBe(initialnodeCount)
})

afterAll(async () => {
    await Promise.all(emails.map(async email => {
        const { data } = await getNodeByIndex({
            nodeType: 'User',
            indexKey: 'email',
            indexValue: email
        })
        if (data) {
            await deleteNode({
                nodeKey: data
            })
        }
    }))
})