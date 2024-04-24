import { v4 as uuidv4 } from 'uuid'
import { z, TypeOf, ZodObject } from 'zod'

export abstract class UixNode {
    static nodeType: Capitalize<string>
    nodeType: Capitalize<string>
    nodeId: string
    createdAt: string
    updatedAt?: string
    constructor(nodeType: UixNode['nodeType']) {
        this.nodeType = nodeType
        this.nodeId = uuidv4()
        this.createdAt = new Date().toISOString()
    }
}




export const defineNode = <
    T extends Capitalize<string>,
    SD extends ZodObject<any>,
>(
    nodeType: T,
    stateDefinition: SD
) => {
    return class extends UixNode {
        // Static
        static nodeType = nodeType
        static stateDefinition = stateDefinition
        // Store
        nodeType = nodeType
        // Properties
        state: TypeOf<SD>

        constructor(initialState: TypeOf<SD>) {
            super(nodeType)
            stateDefinition.parse(initialState)
            this.state = initialState
        }
        update(state: Partial<TypeOf<SD>>) {
            this.state = {
                ...this.state,
                ...state
            }
            this.updatedAt = new Date().toISOString()
        }
    }
}

const UserNode = defineNode('User', z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string()
}))

const user = new UserNode({
    name: 'John Doe',
    email: '',
    password: 'password'
})
