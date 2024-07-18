import { execSync } from 'child_process'
import { v4 as uuid } from 'uuid'
import { expect, test } from 'vitest'
import { Err, tryCatch, UixErrSubtype } from '../src/types/Result'
import { mergeNode, deleteNode, collectNode } from './uix/generated/functionModule'
import { throwTestError } from './utils/throwTestError'
import { writeFile } from 'fs/promises'

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
    // Create Node
    const { data: userNodeA, error: createUserNodeAError } = await mergeNode({
        operation: 'create',
        nodeType: 'User',
        state: {
            email: 'userA@test.com'
        }
    })
    const { data: userNodeB, error: createUserNodeBError } = await mergeNode({
        operation: 'create',
        nodeType: 'User',
        state: {
            email: 'userB@test.com'
        }
    })
    if (createUserNodeAError || createUserNodeBError) throwTestError(createUserNodeAError || createUserNodeBError!)
    console.log("User Node", userNodeA)
    // Create Organization
    const { data: organizationNode, error: createOrganizationNodeError } = await mergeNode({
        operation: 'create',
        nodeType: 'Organization',
        weakRelationshipMap: {
            'ACCESS_TO': {
                from: [{
                    nodeKey: userNodeA,
                    state: {
                        accessLevel: 'owner',
                    }
                }, {
                    nodeKey: userNodeB,
                    state: {
                        accessLevel: 'member'
                    }
                }],
            }
        },
        state: {
            name: "Wendy"
        }
    })
    if (createOrganizationNodeError) throwTestError(createOrganizationNodeError)
    // Create Project
    const { data: projectNode, error: createProjectNodeError } = await mergeNode({
        operation: 'create',
        nodeType: 'Project',
        strongRelationshipMap: {
            'BELONGS_TO': {
                to: {
                    nodeKey: organizationNode,
                    state: {
                        'testing': 'test'
                    }
                }
            }
        },
        weakRelationshipMap: {
            'ACCESS_TO': {
                'from': [{
                    nodeKey: userNodeA,
                    state: {
                        accessLevel: 'owner',
                    }
                }, {
                    nodeKey: userNodeB,
                    state: {
                        accessLevel: 'member',
                    }
                }]
            }
        },
        state: {
            name: "Wendy"
        }
    })
    const { data: chatNode, error: createChatNodeError } = await mergeNode({
        operation: 'create',
        nodeType: 'Chat',
        state: {
            chatType: 'user'
        },
        strongRelationshipMap: {
            'CONVERSATION_BETWEEN': {
                to: [userNodeA, userNodeB]
            }
        }
    })
    if (createChatNodeError) throwTestError(createChatNodeError)
    // Create Messages
    const { data: messageNode1, error: createMessageNode1Error } = await mergeNode({
        operation: 'create',
        nodeType: 'Message',
        state: {
            contentType: 'text',
            text: 'Hello User B!'
        },
        strongRelationshipMap: {
            'SENT_BY': {
                to: userNodeA
            },
            'SENT_IN': {
                to: chatNode
            }
        }
    })
    if (createMessageNode1Error) throwTestError(createMessageNode1Error)
    const { data: messageNode2, error: createMessageNode2Error } = await mergeNode({
        operation: 'create',
        nodeType: 'Message',
        state: {
            contentType: 'text',
            text: 'How are you User A!'
        },
        strongRelationshipMap: {
            'SENT_BY': {
                to: userNodeB
            },
            'SENT_IN': {
                to: chatNode
            }
        }
    })
    if (createMessageNode2Error) throwTestError(createMessageNode2Error)
    const { data: messageNode3, error: createMessageNode3Error } = await mergeNode({
        operation: 'create',
        nodeType: 'Message',
        state: {
            contentType: 'text',
            text: 'I am doing well!'
        },
        strongRelationshipMap: {
            'SENT_BY': {
                to: userNodeA
            },
            'SENT_IN': {
                to: chatNode
            }
        }
    })
    // Update Permissions
    const { data: updatedUserNode } = await mergeNode({
        operation: 'update',
        ...userNodeA,
        weakRelationshipMap: {
            'ACCESS_TO': {
                to: [{
                    nodeKey: organizationNode,
                    state: {
                        accessLevel: 'member'
                    }
                }]
            }
        }
    })
    // Get User A
    const {data: userAByGet} = await collectNode({
        referenceType: 'nodeIndex',
        nodeType: 'User',
        indexKey: 'nodeId',
        indexValue: userNodeA.nodeId,
        relatedBy: {
            ACCESS_TO: {
                to: {
                    Organization: {
                        relatedBy: {
                            'BELONGS_TO': {
                                'from': {
                                    'Project': {
                                        options: {
                                            limit: 1
                                        }
                                    }
                                }
                            }
                        },
                        options: {
                            limit: 5
                        }
                    },
                    
                }
            },
        }
    })
    await writeFile('tests/scratch.json', JSON.stringify(userAByGet, null, 2))
    // // // Delete User A
    // const { data: deletedUserNode } = await deleteNode({
    //     nodeKey: userNodeB
    // })
    // console.log("DeletedUserNode", deletedUserNode)
    console.log("UpdatedUserNode", updatedUserNode)
})