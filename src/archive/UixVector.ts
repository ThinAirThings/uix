import OpenAI from "openai"
import { UixError } from "../base/UixErr"



export class UixVector {
    static openai: OpenAI
    static createEmbeddings: (input: {
        key: string
        value: string
    }) => Promise<{
        keyEmbedding: number[]
        valueEmbedding: number[]
    }>
    nodeType: string
    nodeId: string
    key: string
    value: string
    keyEmbedding?: number[]
    valueEmbedding?: number[]
    constructor(requirements: {
        nodeType: string,
        nodeId: string,
        key: string,
        value: string
    }) {
        if (!UixVector.openai) throw new UixError('Fatal', 'UixVector.openai is not configured')
        const { nodeType, nodeId, key, value } = requirements
        this.nodeType = nodeType
        this.nodeId = nodeId
        this.key = key
        this.value = value;
        (async () => {
            try {
                const embeddings = await UixVector.createEmbeddings({ key, value })
                this.keyEmbedding = embeddings.keyEmbedding
                this.valueEmbedding = embeddings.valueEmbedding
            } catch (error) {
                throw new UixError('Fatal', 'Error creating embeddings', {
                    cause: error
                })
            }
        })()
    }
    static async create(...params: ConstructorParameters<typeof UixVector>) {
        return new UixVector(...params)
    }
    static async update(...params: ConstructorParameters<typeof UixVector>) {

    }
    static configureUixVector(config: ConstructorParameters<typeof OpenAI>) {
        UixVector.openai = new OpenAI(...config)
        UixVector.createEmbeddings = async (input) => {
            if (!UixVector.openai) throw new UixError('Fatal', 'UixVector.openai is not configured')
            try {
                return await UixVector.openai.embeddings.create({
                    model: 'text-embedding-3-large',
                    input: [input.key, input.value],
                    encoding_format: 'float'
                }).then(result => result.data
                    .map(({ embedding }) => embedding)
                    .reduce((acc, val, idx) => {
                        if (idx === 0) acc.keyEmbedding = val
                        if (idx === 1) acc.valueEmbedding = val
                        return acc
                    }, {} as { keyEmbedding: number[], valueEmbedding: number[] })
                )
            } catch (error) {
                throw new UixError('Fatal', 'Error creating embeddings', {
                    cause: error
                })
            }
        }
    }
}