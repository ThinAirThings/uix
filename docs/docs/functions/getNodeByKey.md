---
sidebar_position: 4
---

# getNodeByKey

A function to get a pre-existing node from your database via a nodeKey

Parameters:
- **`nodeKey`**: the nodeKey (```{nodeType, nodeId}```) that specifies the node you wish to fetch

Output:
- **`data`**: the data from the node you wish to fetch consistent with the NodeType's stateSchema, null if error
- **`error`**: the error that occurred, null if operation successful

## Example

Code: 
```typescript 
import { getNodeByKey } from "../uix/functionModule"

const fetchedNode = await getNodeByKey({nodeType: "User", nodeId: "u2md320-dm2e-ic2ncu0n2"})

return fetchedNode
```

Output: 
```typescript
{
  data: {
    username: "username",
    password: "djn2ind92u309nmdjiwundu293udnmsowidjo233jnd23und",
    lastLoginTime: "2024-07-05T15:20:10Z"
  },
  error: null
}
```