---
sidebar_position: 5
---

# Defining Property Vectors

Arguably defining property vectors is one of the greatest draws to using Uix for AI focused implementations. By defining a property vector, your node will be automatically embedded on those properties, allowing for seamless vector search and AI searching implementations.

**Note: you must define an OpenAI key [in your .env file](/docs/getting-started/configure-env-vars) with an active billing plan to use this feature of Uix**

## The definePropertyVector method

definePropertyVector takes the following arguments:
- **`properties`**: an array of strings resembling properties in your node type's stateSchema to be embedded on

_(Note: it is impossible to define a property vector for a property that does not exist on the node, crazy right?)_

## How to Define a Property Vector

Defining a property vector is as simple as appending a method call to the end of the defineNodeType function when defining a node.

1. Define your node type and stateSchema using `defineNodeType` and Zod
```typescript title="./src/libs/nodes/ProfileNodeType.ts"
import { z } from "zod";
import { defineNodeType } from "@thinairthings/uix";
// highlight-start
export const ProfileNodeType = defineNodeType(
    "Profile",
    z.object({
      profileName: z.string().min(4),
      lastSeen: z.string().catch(new Date().toISOString()),
      postCount: z.number().catch(0)
    }),
)
// highlight-end
```

2. Append the `.definePropertyVector()` method to the end of the `defineNodeType()` call.

```typescript title="./src/libs/nodes/ProfileNodeType.ts"
import { z } from "zod";
import { defineNodeType } from "@thinairthings/uix";

export const ProfileNodeType = defineNodeType(
    "Profile",
    z.object({
      profileName: z.string().min(4),
      lastSeen: z.string().catch(new Date().toISOString()),
      postCount: z.number().catch(0)
    }),
    // highlight-start
).definePropertyVector(['profileName'])
// highlight-end
```

_(Note: please make sure to run the CLI to see changes reflected)_

## Now what?

With the property vectors defined, you can now call functions such as [getVectorNodeByKey](/docs/functions/getVectorNodeByKey) to fetch your vector node using the parent node's nodeKey. 

Vector nodes will be automatically re-embedded when an update is made on the node.

Make sure to avoid embedding useless information for your vector search. For example: if you have a node that has a `password` property, it would be a bad idea to embed on that property as it would be a waste of resources, or `postCount` likely doesn't contribute to what you need vectors for.