---
sidebar_position: 2
---

# Define a Node Type

Nodes in a graph database are fragments of data that are connected via edges (relationships). In this section we will define our first node to be used with Uix.

## Create a Node Definition Folder

Create a folder for your node definitions wherever you please. In order to use node definition with Uix, they are imported as variables into the config, so where you place them is personal preference.

For example, I created my node definition folder in `src/libs/nodes`

## Create a Node Definition

Lets start by defining a Null node. Null nodes can be (and are encouraged to be) used as the centerpiece of your graph. Disconnected nodes (nodes with no edges) are discouraged.

1. Create a new file in your node definitions folder called `NullNodeType.ts`

2. Import the following functions

```typescript title='src/libs/nodes/NullNodeType.ts'
import { z } from "zod";
import { defineNodeType } from "@thinairthings/uix";
```

3. Define your Null Node

Using the `defineNodeType` function, define your Null node. `defineNodeType` takes two arguments: 

- type: string, the name of the node type (in this case, "Null")
- stateSchema: zod object, the schema for the node type you are defining

Use `defineNodeType` like such to define your null node:

```typescript title='src/libs/nodes/NullNodeType.ts'
import { z } from "zod";
import { defineNodeType } from "@thinairthings/uix";

// highlight-start
export const NullNodeType = defineNodeType(
    "Null",
    z.object({}),
)
// highlight-end
```

## What Next?

Now that your first node definition is complete, lets set up your environment variables to get your Uix library integrated with its services.