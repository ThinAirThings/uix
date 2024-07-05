---
sidebar_position: 2
---

# updateNode

A function to update a pre-existing node in your database and configured in your `uix.config.ts` file.

Parameters:
- **`nodeKey`**: the nodeKey (```{nodeType, nodeId}```) that specifies the node you wish to update
- **`inputState`**: the properties of the node to be updated and their updated values as key/value pairs consistent with the nodeType specified's stateSchema

Output:
- **`data`**: the data of the node you created consistent with the nodeType's stateSchema, null if an error occured
- **`error`**: the error that occurred, null if operation successful

## Example

Code: 
```typescript 
import { updateNode } from "../uix/functionModule"

const updatedNode = await updateNode(
    {nodeType: "Profile", nodeId: "cjifneinwd29u3ewd2u2d"},
    {
      firstName: "Jane",
      age: 21
    }
  )

return updatedNode
```

Output: 
```typescript
{
  data: {
    firstName: "Jane",
    lastName: "Doe",
    age: 21
  },
  error: null
}
```