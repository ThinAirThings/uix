---
sidebar_position: 2
---

# Defining Unique Indexes

Defining unique indexes can be extremely useful for fetching nodes. For example if you want all users to have unique email addresses or usernames, you can define that as a unique index. This makes it extremely simple to fetch nodes using nodeKeys or indexes, and simultaneously makes it impossible for users to register an account with a username that already exists.

**By default, `nodeId` is a unique index defined on every node.**

## The defineUniqueIndexes method

defineUniqueIndex takes the following arguments:
- **`uniqueIndexes`**: an array of strings resembling properties in your node type's stateSchema

_(Note: it is impossible to define a unique index for a property that does not exist on the node, crazy right?)_

## How to Define a Unique Index

Defining a unique index is as simple as appending a method call to the end of the defineNodeType function when defining a node.

1. Define your node type and stateSchema using `defineNodeType` and Zod
```typescript title="./src/libs/nodes/UserNodeType.ts"
import { z } from "zod";
import { defineNodeType } from "@thinairthings/uix";
// highlight-start
export const UserNodeType = defineNodeType(
    "User",
    z.object({
      username: z.string().min(4),
      email: z.string().email(),
      password: z.string().min(8),
    }),
)
// highlight-end
```

2. Append the `.defineUniqueIndexes()` method to the end of the `defineNodeType()` call.

```typescript title="./src/libs/nodes/UserNodeType.ts"
import { z } from "zod";
import { defineNodeType } from "@thinairthings/uix";

export const UserNodeType = defineNodeType(
    "User",
    z.object({
      username: z.string().min(4),
      email: z.string().email(),
      password: z.string().min(8),
    }),
    // highlight-start
).defineUniqueIndexes(['username', 'email'])
// highlight-end
```

_(Note: please make sure to add any new nodes to the config and run the CLI to see changes reflected)_

## Now what?

With the unique indexes defined, you can now call functions such as [getNodeByIndex](/docs/functions/getNodeByIndex) to fetch your node using your defined indexes. Additionally, nodes that are attempted to be created using a unique index another node has will be blocked. For example, nobody making an account with the code above will be able to make an account with a duplicate email or username to another user.