# Uix by Thin Air

<p>
    <img src="readme.assets/github.banner.png">
</P>

A library for creating typed graph functions. It's like Prisma for Neo4j with TypeScript native schema definitions.

The objective of Uix is to enable the user to declaratively define a graph based data schema and allow Uix to generate fully typed functions which allows interaction with that data.

An example Uix NodeType definition is:

```typescript
import { defineNodeType } from "@thinairthings/uix";
import { z } from "zod";

export const ProfileNodeType = defineNodeType(
  "Profile",
  z.object({
    email: z.string(),
    aboutMe: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    skills: z.string().array().catch([]),
  })
).defineUniqueIndexes(["email"]);
```

After defining a set of NodeTypes, these node types are passed into the Uix config file (uix.config.ts).

## Installation

```bash
npm i @thinairthings/uix@latest
```

## Design Decisions

### Direction of Relationships

- The graph model of Uix is that of a "Directed Graph Structure". This means that relationships between nodes must be given a direction (ie. `(User)-[ACCESS_TO]->(Organization)`).
- To enforce consistency, all relationships must be defined from a first person perspective as opposed to second person. What this means is that when defining a relationship like this:

```ts
export const UserNodeDefinition = defineNode(
  "User",
  z.object({
    email: z.string().email("Invalid email address"),
    firstName: z.string().min(1, "Please enter your first name.").optional(),
    lastName: z.string().min(1, "Please enter your first name.").optional(),
    phoneNumber: z
      .string()
      .min(10, "Please enter a valid phone number.")
      .optional(),
    profilePictureUrl: z.string().optional(),
    activeOrganizationId: z.string().optional(),
  })
)
  .defineUniqueIndexes(["email"])
  .defineRelationship({
    relationshipType: "ACCESS_TO",
    strength: "weak",
    cardinality: "many-to-many",
    toNodeDefinition: ProjectNodeDefinition,
    relationshipStateSchema: z.object({
      accessLevel: z.enum(["admin", "member"]),
    }),
  });
```

You should define it as if you are the node and you are pointing to the node that the relationship applies to. In other words, because you're defining the 'UserNode', you should think of yourself as the UserNode and say "I have ACCESS_TO a project." This is as opposed to this:

```ts
// DON'T DO THIS
export const ProjectNodeDefinition = defineNode(
  "Project",
  z.object({
    name: z.string().min(1, "Please enter a project name."),
  })
).defineRelationship({
  relationshipType: "ACCESS_TO",
  strength: "strong",
  cardinality: "many-to-many",
  toNodeDefinition: UserNodeDefinition,
});
// DON'T DO THIS
```

The above example would be "You have ACCESS_TO a project".



### To Do:
- Add deletion mechanism
- Rewrite the caching strategy to handle optimistic updates

### What is the caching strategy:
Basically, each nodeId is included in a map where the nodeId maps to a set of queryKeys. The idea here is that if you go and get a subgraph of data, upon receiving the set of all nodes in that query, each of the nodes are added to a cache map where the value of the entry in the map is the query key for each useUix query that referenced that node.

After creating a new node via a draft, we need to optimistically update all the subgraphs which that node now becomes apart of. In order to handle this case, we would need to find all subgraphs which contain the previous related node and update it with the draft node. You would also need to assign a nodeId on the client side to handle this case. 

If the previous node is found in a subgraph, you would invalidate the whole subgraph and optimistically update it. The best way to do this would be to optimistically update the tree and then invalidate it if a new reference is returned from Immer.

So, once you've made an optimistic update to a previousNode, you'd go into the queryKeyCacheMap using the previousNode nodeId and then send the returned parameters into a 

```ts
type DraftTree = Record<string, any> | {
  [relationshipType: string]: DraftTree
}
const findModifiedPaths = (draftNode: DraftTree) => {
  const queryNode = queryClient.getQueryData(queryKeyCacheMap.get(draftNode.nodeId))
}
queryClient.invalidate([queryKeyCacheMap[previousNode.nodeId]])
```

