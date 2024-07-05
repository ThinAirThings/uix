---
sidebar_position: 8
---

# getChildNodeSet

A function to get the node set of a node type from a certain parent node.

_(Note: by default, no node sets are defined. They must be defined at your discretion, please see [Defining Node Set Relationships](/docs/defining-nodes/defineNodeSetRelationship) for more info)_

Parameters:
- **`nodeKey`**: the nodeKey (```{nodeType, nodeId}```) that specifies the parent who's children you wish to fetch
- **`childNodeType`**: string, the type of the childNode you wish to fetch

Output:
- **`data`**: the data from the child nodes you wish to fetch consistent with the NodeType's stateSchema, null if error
- **`error`**: the error that occurred, null if operation successful

## Example

_(Note: for reference, the function call below is defined similar to the example [here](/docs/defining-nodes/defineNodeSetRelationship))_

Code: 
```typescript 
import { defineNodeSetRelationship } from "../uix/functionModule"

const fetchedNodes = await defineNodeSetRelationship({nodeType: "Profile", nodeId: "djwqndin23indiwenf8y2b8unediwjenf"}, "Posts")

return fetchedNodes
```

Output: 
```typescript
{
  data: [{
    postTitle: "Hello World",
    postDescription: "I am here!",
    postDate: "2024-07-05T15:20:10Z"
  },
  {
    postTitle: "Goodbye World",
    postDescription: "I am not here!",
    postDate: "2024-06-05T15:20:10Z"
  }],
  error: null
}
```

_(Note: node set relationships must be defined [using the defineNodeSetRelationship method](/docs/defining-nodes/defineNodeSetRelationship))_