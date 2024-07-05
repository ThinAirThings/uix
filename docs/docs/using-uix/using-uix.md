---
sidebar_position: 2
---

# Using Uix

Let's use Uix.

## Typed Operations

Creating functions based on your database schema has never been easier. For example, you can create a function that takes in a User Node based on your schema definition thanks to Zod magic:

```typescript
import { TypeOf } from "zod"
import { UserNodeType } from "../libs/nodes/UserNodeType"

function nodeOperation(userNode: TypeOf<typeof UserNodeType.stateSchema>) {
  console.log(userNode.username)
}
```

Now all operations involving the userNode variable within the function are strictly typed to your database schema, allowing seamless operations between your code and your data.

## Creating a Node

Creating a node with Uix is as simple as importing the createNode function and creating the node.

_(Note: Most Uix functions are asynchronous and are required to be called within async functions)_

```typescript
import { createNode } from "./uix/functionModule"

async function createTheNode() {

  const createdNode = await createNode(
    [{nodeType: "User", nodeId: "u2md320-dm2e-ic2ncu0n2"}], 
    "Profile",
    {
      firstName: "John",
      lastName: "Doe",
      age: 20
    }
  )
  
  if (createdNode.error) return
  else console.log(createdNode.data)

}
```

The createNode function accepts 4 properties (3 required, 1 optional):

- parentNodeKeys: an array of nodeKeys (```{nodeType, nodeId}```) that specify the parent nodes for the node you are creating, for the example above this node will have one parent, a User node with the nodeId `u2md320-dm2e-ic2ncu0n2`.
- nodeType: the node type to be generated: in this case a Profile node wil be generated
- initialState: the initial state of the node to be generated, in this case it will have a firstName of "John", a lastName of "Doe", and an age of 20.
- nodeId _(optional)_: an option to set the nodeId as desired, if left unspecified one will be generated for you

All Uix operations return an object with the following properties:
- data: the data for the node you created, updated or deleted (consistent with your nodeType.stateSchema), null if `error`
- error: the error for the operation you conducted and why it failed, null if `data`

This makes it easy to check if your operation failed or succeeded and act accordingly.

**Please Note:** all nodetypes, initialStates, and parent nodes are **typed** as per your `uix.config.ts` file and node definitions. If you are getting errors creating, updating, or doing any operation with Uix please ensure your function calls are consistent with your config and schemas. **Any change in your config and schema requires you to re run the CLI to generate newly typed functions.**

For more information about the createNode function please view [createNode's docs](/docs/functions/createNode)
