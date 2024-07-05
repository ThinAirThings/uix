---
sidebar_position: 5
---

# getNodeByIndex

A function to get a pre-existing node from your database via a defined unique index.

_(Note: by default, all nodes have `nodeId` as a unique index, but they can be defined using the `defineUniqueIndex` method as shown [here](/docs/defining-nodes/defineUniqueIndexes))_

Parameters:
- **`nodeType`**: string, the node type you wish to fetch
- **`uniqueIndexType`**: string, the unique index you wish to search for
- **`uniqueIndex`**: string, the unique index itself

Output:
- **`data`**: the data from the node you wish to fetch consistent with the NodeType's stateSchema, null if error
- **`error`**: the error that occurred, null if operation successful

## Example

Code: 
```typescript 
import { getNodeByIndex } from "../uix/functionModule"

const fetchedNode = await getNodeByIndex("User", "username", "johndoe")

return fetchedNode
```

Output: 
```typescript
{
  data: {
    username: "johndoe",
    password: "dj32wdi2n393ndunwieudnqijwd9oasimdoajsfe",
    lastLoginTime: "2024-07-05T15:20:10Z"
  },
  error: null
}
```

_(Note: any unique index other than nodeId must be defined [using the defineUniqueIndexes method](/docs/defining-nodes/defineUniqueIndexes))_