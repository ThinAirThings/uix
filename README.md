# Uix by Thin Air
<p>
    <img src="readme.assets/github.banner.png">
</P>

A library for creating typed graph functions. It's like Prisma for Neo4j with TypeScript native schema definitions.

 The objective of Uix is to enable the user to declaratively define a graph based data schema and allow Uix to generate fully typed functions which allows interaction with that data.

Uix is designed to be AI native and implements a set of features for automatically managing embeddings by declaratively defining properties which should be embedded. An example Uix NodeType definition is:
```typescript
import { defineNodeType } from "@thinairthings/uix"
import { z } from 'zod'

export const ProfileNodeType = defineNodeType('Profile', z.object({
    email: z.string(),
    aboutMe: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    skills: z.string().array().catch([]),
}))
    .defineUniqueIndexes(['email'])
    .definePropertyVector(['aboutMe'])
```

After defining a set of NodeTypes, these node types are passed into the Uix config file (uix.config.ts). 


## Installation
```bash
npm i @thinairthings/uix@latest
```