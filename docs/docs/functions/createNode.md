---
sidebar_position: 1
---

# createNode

A function to create a node configured in your `uix.config.ts` file.

Parameters:
- **`parentNodeKeys`**: an array of nodeKeys (```{nodeType, nodeId}```) that specify the parent nodes for the node you are creating
- **`nodeType`**: the node type to be generated (must be defined in your config)
- **`initialState`**: the initial state of the node to be generated, consistent with the nodeType specified's stateSchema
- **`nodeId`** _(optional)_: an option to set the nodeId as desired, if left unspecified one will be generated for you via `uuid()`

Output:
- **`data`**: the data of the node you created consistent with the nodeType's stateSchema, null if an error occured
- **`error`**: the error that occurred, null if operation successful

## Example

Code: 
```typescript 
import { createNode } from "../uix/functionModule"

const createdNode = await createNode(
    [{nodeType: "User", nodeId: "u2md320-dm2e-ic2ncu0n2"}], 
    "Profile",
    {
      firstName: "John",
      lastName: "Doe",
      age: 20
    }
  )

return createdNode
```

Output: 
```typescript
{
  data: {
    firstName: "John",
    lastName: "Doe",
    age: 20
  },
  error: null
}
```