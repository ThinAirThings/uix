---
sidebar_position: 1
---

# Defining a Basic Node

Defining nodes in Uix can be very simple. No methods are necessary to generate a node without vector embeddings, unique indexes, etc.

## How to Define a Node

As seen in the Getting Started section, defining nodes can be done using Zod schemas and the `defineNodeType` function.

1. Start by importing `defineNodeType` from "@thinairthings/uix" and `z` from "Zod"

```typescript title="./src/libs/nodes/GenericNodeType.ts"
// highlight-start
import { z } from "zod";
import { defineNodeType } from "@thinairthings/uix";
// highlight-end
```

2. Define your node type and stateSchema using `defineNodeType` and Zod
```typescript title="./src/libs/nodes/GenericNodeType.ts"
import { z } from "zod";
import { defineNodeType } from "@thinairthings/uix";
// highlight-start
export const GenericNodeType = defineNodeType(
    "Generic",
    z.object({
      firstName: z.string(),
      lastName: z.string().optional(),
      job: z.string().catch("Software Engineer"),
      age: z.number().catch(18),
      email: z.string().email()
    }),
)
// highlight-end
```

## More Information

Conveniently, Zod methods such as `catch()` and `optional()` and other [zod validation methods](https://zod.dev) can be used in the stateSchema. This makes optional properties very easy to handle.

Additionally thanks to Zod, using your defined nodes as types is extremely convenient, for example:

```typescript
import { TypeOf } from "zod";
import { GenericNodeType } from "../../libs/nodes/GenericNodeType.ts"

function doSomethingWithGenericNode(genericNode: TypeOf<typeof GenericNodeType.stateSchema>) {
  ...
}
```

In order to use any generated nodes, make sure to add them to your `uix.config.ts` file like such:

```typescript title='uix.config.ts'
import { defineConfig } from "@thinairthings/uix";
import { NullNodeType } from "./src/libs/nodes/NullNodeType";
// highlight-start
import { GenericNodeType } from "./src/libs/nodes/GenericNodeType";
// highlight-end

export default defineConfig({
    type: "Base",
    // highlight-start
    nodeTypeSet: [NullNodeType, GenericNodeType],
    // highlight-end
});
```

And that you run the CLI to regenerate your functions using
`npm run uix`

_(Note: if you have any issues doing this, please refer back to the [getting started](/docs/category/getting-started) section)_

## What else?

There's a lot more you can do with Uix node definitions than just generating a basic node like such. Let's dive more into that in the next section.