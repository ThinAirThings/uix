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
