import { z } from "zod"
import { defineNode } from "../base/defineNode"
import { GraphLayer } from "./GraphLayer"
import { NodeKey } from "./NodeKey"


type ThisGraph = GraphLayer<[
    ReturnType<typeof defineNode< 'User', ReturnType<typeof z.object<{
        email: ReturnType<typeof z.string>
        name: ReturnType<typeof z.string>
        password: ReturnType<typeof z.string>
    }>>>>,
    ReturnType<typeof defineNode< 'Post', ReturnType<typeof z.object<{
        title: ReturnType<typeof z.string>
        content: ReturnType<typeof z.string>
    }>>>>,
    ReturnType<typeof defineNode< 'Company', ReturnType<typeof z.object<{
        name: ReturnType<typeof z.string>
    }>>>>
], [
        {
            relationshipType: 'HAS_POST',
            uniqueFromNode: true,
            stateDefinition: ReturnType<typeof z.object<{
                createdAtTime: ReturnType<typeof z.string>
                updatedAt: ReturnType<typeof z.string>
            }>>,
        },
        {
            relationshipType: 'WORKED_AT',
        },
        {
            relationshipType: 'HAS_USER',
            stateDefinition: ReturnType<typeof z.object<{
                createdAt: ReturnType<typeof z.string>
                updatedAt: ReturnType<typeof z.string>
            }>>
        }
    ], {
        'User': {
            'HAS_POST': ['Post'],
            'WORKED_AT': ['Company', 'Post']
        },
        'Post': {
            'HAS_USER': ['User']
        }
    }, {
        'User': ['email'],
        'Post': ['title']
    }>

type GetRelatedTo = ThisGraph['getRelatedTo']
const getRelatedTo = null as unknown as GetRelatedTo

const val = await getRelatedTo(null as unknown as NodeKey<'User'>, 'WORKED_AT', 'Post')

type CreateRelationship = ThisGraph['createRelationship']
const createRelationship = null as unknown as CreateRelationship
createRelationship({ nodeType: 'User', nodeId: '123' }, 'WORKED_AT', null as unknown as NodeKey<'Company'>)

createRelationship({ nodeType: 'User', nodeId: '123' }, 'HAS_POST', null as unknown as NodeKey<'Post'>,
    {
        createdAtTime: '2021-01-01',
        updatedAt: '2021-01-01'
    }
)
createRelationship({ nodeType: 'Post', nodeId: '123' }, 'HAS_USER', null as unknown as NodeKey<'User'>, {
    createdAt: '2021-01-01',
    updatedAt: '2021-01-01'
})
type GetNode = ThisGraph['getNode']
const getNode = null as unknown as GetNode
getNode('User', 'email', '')



const obj = z.object({
    email: z.string(),
    name: z.string(),
    password: z.string()
})

Object.keys(obj.shape)