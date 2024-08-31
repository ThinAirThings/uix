


# General Principles
## Why are relationship states push down the subgraph regardless of the direction of the relationship?
Example:

### Node Definition
```ts
export const UserNodeDefinition = defineNode(
    "User",
    z.object({
        email: z.string().email("Invalid email address"),
        firstName: z
            .string()
            .min(1, "Please enter your first name.")
            .optional(),
        lastName: z.string().min(1, "Please enter your last name.").optional(),
        phoneNumber: z
            .string()
            .min(10, "Please enter a valid phone number.")
            .optional(),
        profilePictureUrl: z.string().optional(),
    })
)
.defineRelationship({
    'strength': 'weak',
    'toNodeDefinition': OrganizationNodeDefinition,
    'relationshipType': "MEMBER_OF",
    relationshipStateSchema: z.object({
        accessLevel: z.enum(["admin", "member"]),
    })
})
.defineUniqueIndexes(["email"])
```
### Extraction
```ts
    const {
        data: userNode,
    } = useUixv2({
        rootNodeIndex: useNodeKey('User'),
        defineSubgraph: sg => sg.extendPath('User', '-MEMBER_OF->Organization')
    });
```
The value of userNode would look something like:
```json
{
    "nodeType": "User",
    // other user node data
    "-MEMBER_OF->Organization": {
        "some-organization-node-id": {
            "nodeType": "Organization",
            // other organization node data
            "accessLevel": "admin"  // <- THIS IS WHAT WE'RE TALKING ABOUT
        }
    }
}
```

The thing to note here is that `accessLevel` has to be pushed down in the json subgraph regardless of the direction of the relationship. Because this query could return multiple organization nodes where each triplet (ie. `(User)-[MEMBER_OF]->(Organization)`) has a different `accessLevel` associated with the triplet, the `accessLevel` needs to be pushed to the node which is unique relative to the other triplets in the set. This is a common theme that's required a bit of thought to come to the conclusion of which is why I'm writing it down here.

The same idea is also true for merge functionality. The relationship properties must always be pushed down the subgraph and merged into the unique node within the triplet. 


# TypeScript Patterns
## Exact Types / Strict Object Literals

### This will fail
```ts
export const mergeSubgraphFactory = <
    NodeDefinitionMap extends AnyNodeDefinitionMap,
>(
    nodeDefinitionMap: NodeDefinitionMap
) => neo4jAction(async <
    NodeType extends keyof NodeDefinitionMap,
    InputTree extends MergeInputTree<NodeDefinitionMap, NodeType>
>(subgraph: ({nodeType: NodeType}&InputTree)) => {
    // Do Stuff
})
```

Specifically, this will be allowed:
```ts
const {
    data: jobs, error: jobsError
} = await mergeSubgraph({
    nodeType: 'Company',
    name: 'Thin Air Computer',
    '': 'fsda',
})
```

TypeScript's structural typing system considers objects with extra properties as compatible with types that have fewer properties, as long as the required properties are present and of the correct type. To solve this you need to use a technique called "exact types" or "strict object literal checking".

#### Example:
This will fail:
```ts
type Constraint = {a: string, b: number}
const constrainIncorrectly = <T extends Constraint>(
    input: T
) => input;
```
This will work:
```ts
const constrainCorrectly = <T extends Constraint>(
    input: T & {
        [K in keyof T]: K extends keyof Constraint ? T[K] : never;
    }
) => input;
```


