---
sidebar_position: 9
---

# getVectorNodeByKey

A function to get a pre-existing vector node from your database via the parent's nodeKey

Parameters:
- **`parentNodeKey`**: the nodeKey (```{nodeType, nodeId}```) that specifies the parent node you wish to fetch its vector node

Output:
- **`data`**: the data from the vector node consistent with your [property vector definitions](/docs/defining-nodes/definePropertyVectors), null if error
- **`error`**: the error that occurred, null if operation successful

## Example

_(Note: for reference, the function call below is defined similar to the example [here](/docs/defining-nodes/definePropertyVector))_

Code: 
```typescript 
import { getVectorNodeByKey } from "../uix/functionModule"

const fetchedVectorNode = await getVectorNodeByKey({nodeType: "Profile", nodeId: "cjnewinfidn23ieundinewfysufninjgk"})

return fetchedVectorNode
```

Output: 
```typescript
{
  data: {
    profileName: [
    0.48923954, 0.7649053,  0.42391795, 0.29867493, 0.00892864, 0.93162091,
    0.26841362, 0.8304087,  0.39520501, 0.65026287, 0.76820827, 0.72490674,
    0.10640718, 0.53749267, ... (x 3057) , 0.12345678
    ],
  },
  error: null
}
```