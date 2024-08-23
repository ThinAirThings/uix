
// Start of File
import {createNeo4jClient} from '@thinairthings/uix'


export const driver = createNeo4jClient({
    uri: process.env.NEO4J_URI!,
    username: process.env.NEO4J_USERNAME!,
    password: process.env.NEO4J_PASSWORD!
}, { disableLosslessIntegers: true })
