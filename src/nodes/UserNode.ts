import { TypeOf, ZodObject } from "zod";
import { UixNode } from "../base/UixNode";



export class UserNode extends UixNode {
    name: string
    constructor(name: string) {
        super('User')
        this.name = name
    }
    static async create(name: string) {
        return new UserNode(name)
    }
    static async update(name: string) {
    }
}




export const defineUixNode = <
    T extends Capitalize<string>,
    P extends ZodObject<{}>
>(
    nodeType: T,
    definitionOfProperties: P,
) => class extends UixNode {
        static readonly nodeType: T = nodeType
        state: TypeOf<P>
        constructor(initialState: TypeOf<P>) {
            super(nodeType)
            definitionOfProperties.parse(initialState)
            this.state = initialState
        }
        static async create(properties: P['_input']) {
            return new this(properties)
        }
        static async update(properties: P['_input']) {
        }
    }
