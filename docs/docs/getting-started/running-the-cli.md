---
sidebar_position: 6
---

# Running the CLI

Now that all of your configuration is created and ready to go, we can run the CLI to generate our functions.

## Adding the necessary npm script

To ensure that the `.env` file is loaded, add the following script to your `package.json` file

```javascript title="package.json"
"scripts": {
    ...,
    "uix": "dotenvx run -f .env -- uix",
    ...
  },
```

If your `.env` file uses another name other than `.env`, please reflect it in the script.

For example, if your `.env` file is named `.env.local`, please add

```javascript title="package.json"
"scripts": {
    ...,
    "uix": "dotenvx run -f .env.local -- uix",
    ...
  },
```

## Running the CLI

Now it is time to run the CLI. Please run the following in your terminal

```shell
npm run uix
```

And you should see something similar to the following result in your terminal

```shell
__/\\\________/\\\__/\\\\\\\\\\\__/\\\_______/\\\
 _\/\\\_______\/\\\_\/////\\\///__\///\\\___/\\\/_
  _\/\\\_______\/\\\_____\/\\\_______\///\\\\\\/___
   _\/\\\_______\/\\\_____\/\\\_________\//\\\\_____
    _\/\\\_______\/\\\_____\/\\\__________\/\\\\_____
     _\/\\\_______\/\\\_____\/\\\__________/\\\\\\____
      _\//\\\______/\\\______\/\\\________/\\\////\\\__
       __\///\\\\\\\\\/____/\\\\\\\\\\\__/\\\/___\///\\\
        ____\/////////_____\///////////__\///_______\///_


Uix Graph System 🔥 by 🐰 Thin Air


✅ Uix config found @ /home/thinair/project/uix.config.ts
✅ Code Generated @/home/thinair/project/uix: Fully-typed operations
✅ Successfully created NodeType vector for NullNode
✅ Successfully created unique index for NullNode on property nodeId
✅ Null node created.
```

Now you should see the following files under your `uix` or other specified output directory:

```
└── uix/
    ├── functionModule.ts
    ├── queryOptions.ts
    ├── staticObjects.ts
    ├── UixProvider.tsx
    ├── useNodeIndex.ts
    ├── useNodeKey.ts
    ├── useNodeSet.ts
    ├── useNodeType.ts
    └── useUniqueChild.ts
```

`functionModule.ts` is where your generated functions will live, all functions will be imported from there.

`UixProvider.tsx` provides a QueryClientProvider required for Uix to run queries.

## What's next?

Now that your configuration is set up and your functions are generated, you can start using Uix.

