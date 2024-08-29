
import { reverseRelationshipMapKey, SubgraphDefinition, SubgraphPathDefinition } from "@thinairthings/uix"
import { nodeDefinitionMap } from "./uix/generated/staticObjects"
import _ from "lodash"

// const subgraphDefinition = new SubgraphDefinition(nodeDefinitionMap, [new SubgraphPathDefinition(
//     nodeDefinitionMap,
//     'User',
//     []
// )])
// .extendPath('User', '-BELONGS_TO->Company')
// .extendPath('User-BELONGS_TO->Company', '<-BELONGS_TO-Project')

// const keys = subgraphDefinition.pathDefinitionSet.forEach(path => 
//     console.log(path.pathType)
// )

// type PathSegment = `-${string}->${string}` | `<-${string}-${string}`

// const data = {
//     a: 5,
//     b: 'b',
//     c: 7
// }

// const data2 = {
//     d: 'fdsa',
//     e: 'ffff'
// }

// console.log(_.merge(data, data2))

const rel1 = "-SWIPED_ON->Job"
const rel2 = "<-BELONGS_TO-Company"
console.log(reverseRelationshipMapKey(rel1))
console.log(reverseRelationshipMapKey(rel2))


