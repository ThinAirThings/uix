import { execSync } from 'child_process'
import { test } from 'vitest'
import { Err, tryCatch } from '../src/types/Result'
import { mergeSubgraph } from './uix/generated/functionModule'
import { throwTestError } from './utils/throwTestError'

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
    const { data: userNodeA, error: createUserNodeAError } = await mergeSubgraph({
        operation: 'create',
        nodeType: 'User',
        state: {
            email: 'userA@test.com'
        }
    })
    const { data: userNodeB, error: createUserNodeBError } = await mergeSubgraph({
        operation: 'create',
        nodeType: 'User',
        state: {
            email: 'userB@test.com'
        }
    })
    if (createUserNodeAError || createUserNodeBError) throwTestError(createUserNodeAError || createUserNodeBError!)
    console.log("User Node", userNodeA)
    // Create Organization
    const { data: organizationNode, error: createOrganizationNodeError } = await mergeSubgraph({
        operation: 'create',
        nodeType: 'Organization',
        weakRelationshipMap: {
            'ACCESS_TO': {
                from: [{
                    nodeKey: userNodeA,
                    state: {
                        accessLevel: 'member',
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
            name: "Ranger Solar",
            'ceo': "Bob Johnson",
            'employees': 100
        }
    })
    // Create Organization2
    const { data: organizationNode2, error: createOrganizationNodeError2 } = await mergeSubgraph({
        operation: 'create',
        nodeType: 'Organization',
        weakRelationshipMap: {
            'ACCESS_TO': {
                from: [{
                    nodeKey: userNodeA,
                    state: {
                        accessLevel: 'member',
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
            name: "Thin Air",
            'ceo': "Tim Stevens",
            'employees': 100
        }
    })
    if (createOrganizationNodeError2) throwTestError(createOrganizationNodeError2)
    if (createOrganizationNodeError) throwTestError(createOrganizationNodeError)
    // Create Project
    const { data: projectNode, error: createProjectNodeError } = await mergeSubgraph({
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
            name: "Solar Project for Bill"
        }
    })
    // Create Project
    const { data: projectNode2, error: createProjectNodeError2 } = await mergeSubgraph({
        operation: 'create',
        nodeType: 'Project',
        strongRelationshipMap: {
            'BELONGS_TO': {
                to: {
                    nodeKey: organizationNode2,
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
            name: "Other project"
        }
    })
    const { data: chatNode, error: createChatNodeError } = await mergeSubgraph({
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
    const { data: messageNode1, error: createMessageNode1Error } = await mergeSubgraph({
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
    const { data: messageNode2, error: createMessageNode2Error } = await mergeSubgraph({
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
    const { data: messageNode3, error: createMessageNode3Error } = await mergeSubgraph({
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
    const { data: updatedUserNode } = await mergeSubgraph({
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

    // await writeFile('tests/scratch.json', JSON.stringify(userAByGet, null, 2))
    // // // Delete User A
    // const { data: deletedUserNode } = await deleteNode({
    //     nodeKey: userNodeB
    // })
    // console.log("DeletedUserNode", deletedUserNode)
    console.log("UpdatedUserNode", updatedUserNode)
})