---
sidebar_position: 5
---

# Define Uix Config

Uix is a CLI based function generation tool, so it only makes sense that it requires some configuration to know what to generate. This configuration should live in the root of your repo under the name `uix.config.ts`


## How to Configure Uix

1. Start by making a `uix.config.ts` file at the root of your repository.

2. Import the following to `uix.config.ts`

```typescript title="uix.config.ts"
import { defineConfig } from "@thinairthings/uix"
import { NullNodeType } from "./src/libs/nodes/NullNodeType"
// Import any other node type you may have defined, 
// or update the filepath to reflect the location of your node definitions
```

3. Use the `defineConfig` function to configure your Uix instance

The `defineConfig` function is responsible for defining your Uix config as it suggests. It takes the following attributes:

- options — The configuration options.

- options.type — The type of the graph. (ie. 'Base')

- options.nodeTypeSet — An array of NodeTypes as defined by defineNodeType.

- options.envPath _(optional)_ — The optional environment path. If unspecified, defaults to '.env'.

- options.outdir  _(optional)_ — The optional output directory. If unspecified, defaults to 'uix'.

For example, for our configuration (using `.env` and the `NullNodeType` we defined before), our configuration should look like this:

```typescript title="uix.config.ts"
import { defineConfig } from "@thinairthings/uix";
import { NullNodeType } from "./src/libs/nodes/NullNodeType";

// highlight-start
export default defineConfig({
    type: "Base",
    nodeTypeSet: [NullNodeType],
});
// highlight-end
```

4. Now your config is generated and you can run the CLI to generate your functions.

## Other Examples

If your config uses more node definitions, it may look something like this:

```typescript title="uix.config.ts"
import { defineConfig } from "@thinairthings/uix";
import { NullNodeType } from "./src/libs/nodes/NullNodeType";
import { AuthNodeType } from "./src/libs/nodes/AuthNodeType";
import { UserNodeType } from "./src/libs/nodes/UserNodeType";
import { ProfileNodeType } from "./src/libs/nodes/ProfileNodeType";
import { MessageNodeType } from "./src/libs/nodes/MessageNodeType";
import { ClientNodeType } from "./src/libs/nodes/ClientNodeType";

export default defineConfig({
    type: "Base",
    nodeTypeSet: [NullNodeType, AuthNodeType, UserNodeType, ProfileNodeType, MessageNodeType, ClientNodeType],
});
```

If you want to specify locations for your Uix generated functions or your .env, it may look like this

```typescript title="uix.config.ts"
import { defineConfig } from "@thinairthings/uix";
import { NullNodeType } from "./src/libs/nodes/NullNodeType";

export default defineConfig({
    type: "Base",
    nodeTypeSet: [NullNodeType],
    outdir: "uix/generated/functions",
    envPath: ".env.local"
});
```

There are several ways you can define your Uix config with the configuration. This config file is meant to change and grow as your project does, running the CLI for every change in the config should leave your project unaffected unless you made breaking changes to nodetypes in use in your project (eg: removing a property from a nodetype that was used by functions in your app), or updated the output directory for Uix functions. Both are minor changes that should be expected from a config update like such.

## What's next?

Now that our node is defined, config is created, and env variables are set up: we can proceed to running the CLI.