# Drizzle ORM adapter for next-auth

This repo is a quick playground version of an adapter for using Drizzle ORM & Postgres with
next-auth package.

This is code is not production-ready but can be used for playing around with Next-Auth, Drizzle ORM and Postgres.

Use at your own risk.

## How to use

1. Add following dependencies to `package.json`:

```
  "dependencies": {
    "drizzle-orm": "^0.22.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.17.0"
  }
```

2. Set up database configuration to `db/index.ts`. It is of course not good idea to store
   credentials in JS in the code but as said, this is only for testing out.

3. Add adapter to your Next-Auth's configuration:

```
  import { type NextAuthOptions } from "next-auth";

  import DrizzlePgAdapter from "./drizzle.adapter";
  import { db } from "./db";

  const authOptions: NextAuthOptions = {
    ...
    adapter: DrizzlePgAdapter(db),
    ...
  };
```

4. Add scripts to `package.json`:

```
"scripts": {
  "db:generate": "drizzle-kit generate:pg",
  "db:push": "drizzle-kit up:pg"
},
```

5. Generate migration files by running `$ npx db:generate`

6. Push changes to database by running `$ npx db:push`

### Docs

[Next-Auth documentation](https://next-auth.js.org)

[Drizzle ORM](https://github.com/drizzle-team/drizzle-orm)
