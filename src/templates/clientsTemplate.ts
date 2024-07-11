import dedent from "dedent"
import { GenericUixConfig } from "../config/defineConfig"





export const clientsTemplate = (config: GenericUixConfig) => {
    return /* ts */`
// Start of File
import {createNeo4jClient} from '@thinairthings/uix'


export const driver = createNeo4jClient({
    uri: process.env.NEO4J_URI!,
    username: process.env.NEO4J_USERNAME!,
    password: process.env.NEO4J_PASSWORD!
}, { disableLosslessIntegers: true })
${config.graph.nodeTypeSet.some(nodeType => nodeType.matchToRelationshipTypeSet.length || nodeType.propertyVectors.length)
            ? /*ts*/`
import OpenAI from 'openai'
export const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!
})
` : ''}`
}