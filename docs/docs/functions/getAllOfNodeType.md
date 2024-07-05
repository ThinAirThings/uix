---
sidebar_position: 6
---

# getAllOfNodeType

A function to get a all nodes of a certain node type.

Parameters:
- **`nodeType`**: string, the node type you wish to fetch
- **`options`** _(optional)_: \{
  - **`limit`** _(optional)_: number, the limit of # of nodes you wish to fetch
  - **`page`** _(optional)_: number, the page of nodes you wish to fetch
  - **`orderBy`** _(optional)_: "updatedAt" | "createdAt", which of those to order the result by
  - **`orderDirection`** _(optional)_: "ASC" | "DESC", whether to order the nodes ascending or descending per the `orderBy` prop
  
\}

Output:
- **`data`**: the data from the node you wish to fetch consistent with the NodeType's stateSchema, null if error
- **`error`**: the error that occurred, null if operation successful

## Example 1 

With no options passed

Code: 
```typescript 
import { getAllOfNodeType } from "../uix/functionModule"

const fetchedNodes = await getAllOfNodeType("User")

return fetchedNodes
```

Output: 
```typescript
{
  data: [{
    username: "johndoe",
    password: "dj32wdi2n393ndunwieudnqijwd9oasimdoajsfe",
    lastLoginTime: "2024-07-05T15:20:10Z"
  }, 
  {
    username: "janedoe",
    password: "fdnwinedun2idmnci2mnedkqwjndkjsndksjnfks",
    lastLoginTime: "2024-07-03T15:34:10Z"
  }],
  error: null
}
```

## Example 2

With options passed

Code: 
```typescript 
import { getAllOfNodeType } from "../uix/functionModule"

const fetchedNodes = await getAllOfNodeType("User", {limit: 1})

return fetchedNodes
```

Output: 
```typescript
{
  data: [{
    username: "johndoe",
    password: "dj32wdi2n393ndunwieudnqijwd9oasimdoajsfe",
    lastLoginTime: "2024-07-05T15:20:10Z"
  }],
  error: null
}
```