---
sidebar_position: 7
---

# getUniqueChildNode

A function to get a unique child node of a certain parent node.

_(Note: by default, no unique child nodes are defined. They must be defined at your discretion, please see [Defining Unique Relationships](/docs/defining-nodes/defineUniqueRelationship) for more info)_

Parameters:
- **`nodeKey`**: the nodeKey (```{nodeType, nodeId}```) that specifies the parent who's child you wish to fetch
- **`childNodeType`**: string, the type of the childNode you wish to fetch

Output:
- **`data`**: the data from the child node you wish to fetch consistent with the NodeType's stateSchema, null if error
- **`error`**: the error that occurred, null if operation successful

## Example

_(Note: for reference, the function call below is defined similar to the example [here](/docs/defining-nodes/defineUniqueRelationship))_

Code: 
```typescript 
import { getUniqueChildNode } from "../uix/functionModule"

const fetchedNode = await getUniqueChildNode({nodeType: "User", nodeId: "wfiwfjoiewjfowjr902ifj93ief93jnciwf"}, "Profile")

return fetchedNode
```

Output: 
```typescript
{
  data: {
    profileName: "John's Profile",
    lastSeen: "2024-07-05T15:20:10Z",
    postCount: 12
  },
  error: null
}
```

_(Note: unique relationships must be defined [using the defineUniqueRelationship method](/docs/defining-nodes/defineUniqueRelationship))_