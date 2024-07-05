---
sidebar_position: 4
---

# Defining Node Set Relationships

Similar to [defining a Unique Relationship](/docs/defining-nodes/defineUniqueRelationship), defining Node Set relationships is extremely useful. For example: a user may only have one unique profile, but that profile will have anywhere from zero to unlimited posts

## The defineNodeSetRelationship method

defineNodeSetRelationship takes the following arguments:
- **`toNodeType`**: the node type definition (as defined in its own definition file)

## How to Define a Node Set Relationship

Defining a node set relationship is as simple as appending a method call to the end of the defineNodeType function when defining a node.

For example, lets say we want our Profile Node to have a node set relationship with its posts.

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

2. Import the node types you wish to create unique relationships for
```typescript title="./src/libs/nodes/ProfileNodeType.ts"
import { z } from "zod";
import { defineNodeType } from "@thinairthings/uix";
// highlight-start
import { PostNodeType } from "./PostNodeType";
// highlight-end

export const ProfileNodeType = defineNodeType(
    "Profile",
    z.object({
      profileName: z.string().min(4),
      lastSeen: z.string().catch(new Date().toISOString()),
      postCount: z.number().catch(0)
    }),
)
```


3. Append the `.defineNodeSetRelationship()` method to the end of the `defineNodeType()` call with the nodes passed in.

_(Note: for more than one node like this scenario, you must pass them individually as individual method calls)_

```typescript title="./src/libs/nodes/ProfileNodeType.ts"
import { z } from "zod";
import { defineNodeType } from "@thinairthings/uix";
import { PostNodeType } from "./PostNodeType";

export const ProfileNodeType = defineNodeType(
    "Profile",
    z.object({
      profileName: z.string().min(4),
      lastSeen: z.string().catch(new Date().toISOString()),
      postCount: z.number().catch(0)
    }),
    // highlight-start
).defineNodeSetRelationship(PostNodeType)
// highlight-end
```

_(Note: please make sure to run the CLI to see changes reflected)_

## Now what?

With the node set relationships defined, you can now call functions such as [getChildNodeSet](/docs/functions/getChildNodeSet) to fetch your unique node using **its parent's node information**. 

This is great, because it means that you don't need to hunt for the Profile's Posts node ID/unique index when you already have the Profile's ID.
