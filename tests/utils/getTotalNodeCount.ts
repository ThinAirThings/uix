import { EagerResult, Integer } from "neo4j-driver";
import { driver } from "../uix/generated/functionModule";




export const getTotalNodeCount = async () => await driver.executeQuery<EagerResult<{ count: Integer }>>(/*cypher*/`MATCH (n) RETURN count(n) as count`).then(result => result.records[0].get('count').toNumber())