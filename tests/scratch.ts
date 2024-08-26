
import { SubgraphDefinition, SubgraphPathDefinition } from "@thinairthings/uix"
import { nodeDefinitionMap } from "./uix/generated/staticObjects"


const subgraphDefinition = new SubgraphDefinition(nodeDefinitionMap, [new SubgraphPathDefinition(
    nodeDefinitionMap,
    'User',
    []
)])
.extendPath('User', '-BELONGS_TO->Company')
.extendPath('User-BELONGS_TO->Company', '<-BELONGS_TO-Project')

const keys = subgraphDefinition.pathDefinitionSet.forEach(path => 
    console.log(path.pathType)
)




