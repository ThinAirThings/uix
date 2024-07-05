---
sidebar_position: 3
---

# Defining Unique Relationships

Defining unique relationships can be extremely useful for maintaining data. For example, if you want to define a Profile for your User node, but every user should only have one profile, then you can define that as such.

## The defineUniqueRelationship method

defineUniqueRelationships takes the following arguments:
- **`uniqueNode`**: the node type definition (as defined in its own definition file)

## How to Define a Unique Relationship

Defining a unique relationship is as simple as appending a method call to the end of the defineNodeType function when defining a node.

For example, lets say we want our User Node to have one unique Profile Node and one unique Birthday Node, *because why would a user have more than one birthday?*

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

2. Import the node types you wish to create unique relationships for
```typescript title="./src/libs/nodes/UserNodeType.ts"
import { z } from "zod";
import { defineNodeType } from "@thinairthings/uix";
// highlight-start
import { ProfileNodeType } from "./ProfileNodeType";
import { BirthdayNodeType } from "./BirthdayNodeType";
// highlight-end

export const UserNodeType = defineNodeType(
    "User",
    z.object({
      username: z.string().min(4),
      email: z.string().email(),
      password: z.string().min(8),
    }),
)
```


3. Append the `.defineUniqueRelationship()` method to the end of the `defineNodeType()` call with the nodes passed in.

_(Note: for more than one node like this scenario, you must pass them individually as individual method calls)_

```typescript title="./src/libs/nodes/UserNodeType.ts"
import { z } from "zod";
import { defineNodeType } from "@thinairthings/uix";
import { ProfileNodeType } from "./ProfileNodeType";
import { BirthdayNodeType } from "./BirthdayNodeType";

export const UserNodeType = defineNodeType(
    "User",
    z.object({
      username: z.string().min(4),
      email: z.string().email(),
      password: z.string().min(8),
    }),
    // highlight-start
).defineUniqueRelationship(ProfileNodeType)
.defineUniqueRelationship(BirthdayNodeType)
// highlight-end
```

_(Note: please make sure to run the CLI to see changes reflected)_

## Now what?

With the unique relationships defined, you can now call functions such as [getUniqueChildNode](/docs/functions/getUniqueChildNode) to fetch your unique node using **its parent's node information**. 

This is great, because it means that you don't need to hunt for the User's Profile node ID/unique index when you already have the User's ID. Additionally, nodes that are attempted to be created using a unique relationship will be blocked. For example, nobody making an account will have more than one Profile or more than one Birthday.
