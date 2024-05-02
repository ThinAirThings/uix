import { ZodObject } from "zod"






export const createRelationshipDictionary = <
    R extends readonly {
        relationshipType: Uppercase<string>
        uniqueFromNode?: boolean
        stateDefinition?: ZodObject<any>
    }[]
>(
    relationshipDefinitions: R
) => Object.fromEntries(
    relationshipDefinitions.map(({
        relationshipType,
        stateDefinition,
        uniqueFromNode
    }) => [relationshipType, { stateDefinition, uniqueFromNode }])
) as {
        [RT in R[number]['relationshipType']]: {
            relationshipType: RT
            stateDefinition?: R[number]['stateDefinition']
            uniqueFromNode?: boolean
        }
    }