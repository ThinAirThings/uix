import { EagerResult, Integer } from "neo4j-driver";
import { driver } from "../uix/generated/staticObjects"




export const getTotalNodeCount = async () => await driver.executeQuery<EagerResult<{ count: number }>>(/*cypher*/`MATCH (n) RETURN count(n) as count`).then(result => result.records[0].get('count'))