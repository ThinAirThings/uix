import { v4 as uuidv4 } from 'uuid'
import { z, TypeOf, ZodObject } from 'zod'
import { NodeDefinition } from '../layers/Neo4j/configureNeo4jLayer'

export abstract class UixNode<
    SD extends ZodObject<any> = ZodObject<any>,
> {
    static nodeType: string
    static stateDefinition: ZodObject<any>
    nodeId: string
    createdAt: string
    updatedAt?: string
    abstract state: TypeOf<SD>
    constructor(hydration: {
        nodeId: string,
        createdAt: string,
        updatedAt?: string
    }) {
        const { nodeId, createdAt, updatedAt } = hydration
        this.nodeId = nodeId
        this.createdAt = createdAt
        this.updatedAt = updatedAt
    }
}


export const defineNode = <
    T extends Capitalize<string>,
    SD extends ZodObject<any>,
>(
    nodeType: T,
    stateDefinition: SD
) => {
    return class NodeType extends UixNode<SD> {
        // Static
        static nodeType = nodeType
        static stateDefinition = stateDefinition
        // Store
        nodeType = nodeType
        // Properties
        state: TypeOf<SD>
        static create = (initialState: TypeOf<SD>) => {
            return new NodeType({
                nodeId: uuidv4(),
                createdAt: new Date().toISOString(),
                initialState
            })
        }
        static get = (hydration: {
            nodeId: string,
            createdAt: string,
            updatedAt?: string,
            initialState: TypeOf<SD>
        }) => {
            return new NodeType(hydration)
        }
        static update = (state: Partial<TypeOf<SD>>) => {
            return new NodeType({
                nodeId: uuidv4(),
                createdAt: new Date().toISOString(),
                initialState: state
            })
        }
        constructor(hydration: {
            nodeId: string,
            createdAt: string,
            updatedAt?: string,
            initialState: TypeOf<SD>
        }) {
            super(hydration)
            const { initialState } = hydration
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


