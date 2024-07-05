---
sidebar_position: 3
---

# Environment Variables

Out of the box Uix is integrated with services such as Neo4j and OpenAI. Using Neo4j is required with Uix as it is the only graph lib we currently support (more coming soon), but OpenAI use is optional.

Use of OpenAI is required for Uix features such as vector embeddings. If your intention is to embed your nodes for vector search, it is a required API key to have in your .env file. If this is not the case, it will not be necessary.

## What You'll Need

- A Neo4j instance (local via Docker, or deployed via Aura or some other service)
  - Your Neo4j URI
  - Your Neo4j Username
  - Your Neo4j Password
- An OpenAI API Key _(optional)_

For more information on how to obtain these, please visit the [Neo4j Aura Documentation](https://www.neo4j.com/docs/aura/) or the [OpenAI API Documentation](https://platform.openai.com/docs/overview)

## How to Configure your .env file

1. As stated before, only your Neo4j instance credentials are required to use Uix, but OpenAI use is supported. Please populate your .env file like such.

```typescript title=".env"
NEO4J_URI="YOUR NEO4J INSTANCE URI"
NEO4J_USERNAME="YOUR NEO4J INSTANCE USERNAME"
NEO4J_PASSWORD="YOUR NEO4J INSTANCE PASSWORD"
OPENAI_API_KEY="YOUR OPENAI API KEY"
```

2. If you don't wish to use OpenAI and features such as Vector Embeddings, please provide a placeholder string like such.

```typescript title=".env"
OPENAI_API_KEY="unused"
```

_(Note: you will not receive errors with this workaround unless you attempt to use vector embeddings with Uix)_

## What's next?

Now you can continue to writing your `uix.config.ts` file in the next section.