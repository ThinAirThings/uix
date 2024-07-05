---
sidebar_position: 3
---

# deleteNode

A function to delete a pre-existing node in your database

Parameters:
- **`nodeKey`**: the nodeKey (```{nodeType, nodeId}```) that specifies the node you wish to delete

Output:
- **`data`**: an array of nodeKeys (```{nodeType, nodeId}```) for the parent nodes of the deleted node, null if error
- **`error`**: the error that occurred, null if operation successful

## Example

Code: 
```typescript 
import { deleteNode } from "../uix/functionModule"

const deletedNode = await deleteNode({nodeType: "Profile", nodeId: "cjifneinwd29u3ewd2u2d"})

return deletedNode
```

Output: 
```typescript
{
  data: [{
    parentNodeId: "u2md320-dm2e-ic2ncu0n2",
    parentNodeType: "User"
  }],
  error: null
}
```