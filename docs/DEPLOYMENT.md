# Deployment

This project supports two database modes:

- Local development: SQLite via `prisma/schema.prisma`.
- Production: PostgreSQL via `prisma-postgres/schema.prisma`.

## Free MVP Stack

Recommended low-cost MVP setup:

- Database: Supabase Free Postgres.
- App hosting: Render Free Web Service.

Important limitations:

- Supabase Free includes a dedicated Postgres database with a 500 MB database
  size limit and may pause inactive projects.
- Render Free web services spin down after idle periods and cold-start on the
  next request. This is acceptable for demos, but not ideal for a public Shopify
  app.

## Supabase

1. Create a Supabase project.
2. Open Project Settings -> Database.
3. Copy the Session pooler connection string.
4. Set it as `DATABASE_URL` in your hosting provider.

For this project, Prisma migrations should use the Supabase Session pooler, not
the Transaction pooler. Use port `5432` on the pooler host:

```txt
postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:5432/postgres?sslmode=require
```

The Transaction pooler on port `6543` is useful for some serverless runtimes,
but Prisma migrations can hang or fail there.

The production Prisma schema is:

```shell
prisma-postgres/schema.prisma
```

To apply production migrations manually:

```shell
npm run setup:prod
```

## Render

This repo includes `render.yaml`, so Render can create a free web service from
the repository.

Build command:

```shell
npm ci && npm run setup:prod && npm run build
```

Start command:

```shell
npm run start
```

Required environment variables:

```txt
DATABASE_URL=postgresql://...
SHOPIFY_API_KEY=...
SHOPIFY_API_SECRET=...
SHOPIFY_APP_URL=https://your-render-service.onrender.com
SCOPES=read_orders,read_returns,read_products,read_customers
NODE_ENV=production
```

After Render gives you the final service URL:

1. Set `SHOPIFY_APP_URL` to that URL.
2. In Shopify Partner Dashboard, set the app URL to the same URL.
3. Add this redirect URL:

```txt
https://your-render-service.onrender.com/auth/callback
```

4. Deploy or update the Shopify app configuration.

## Local Development

Keep using SQLite locally:

```shell
npm run setup
npm run dev
```

Do not use the local SQLite database in production. Free web hosts usually have
ephemeral filesystems, so local files can be lost on restart or redeploy.
