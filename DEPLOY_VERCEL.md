# Deploy ReturnGuard AI to Vercel

Migration guide from Render to Vercel. For Shopify App Store submission, see [SHOPIFY_APP_STORE.md](./SHOPIFY_APP_STORE.md).

## Why Vercel

- No cold starts on the Hobby plan (Render Free spins down after idle).
- Automatic HTTPS and preview deployments per branch.
- Same PostgreSQL database (Supabase or Vercel Postgres) can be reused from Render.

## 1. Prerequisites

- GitHub repo connected to Vercel.
- PostgreSQL database with existing migrations applied (reuse `DATABASE_URL` from Render/Supabase).
- Shopify Partner app credentials.

## 2. Create Vercel project

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repository.
2. Set **Root Directory** to `return-guard-ai` if the repo root is `ReturnGuard-AI`.
3. Vercel should detect **Remix**. Build settings are defined in `vercel.json`:
   - **Build command:** `npm run vercel-build` (runs Prisma migrations + Remix build)
   - **Install command:** `npm ci --legacy-peer-deps`

## 3. Disable Vercel Authentication

In **Project Settings → Deployment Protection**, turn off **Vercel Authentication** for Production (and Preview if you test installs there). Shopify Admin loads the app in an iframe; Vercel login breaks OAuth and webhooks.

## 4. Environment variables

In **Project Settings → Environment Variables**, add:

| Variable | Value |
|----------|--------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | PostgreSQL connection string (see below) |
| `SHOPIFY_API_KEY` | Partner Dashboard → App → Client credentials |
| `SHOPIFY_API_SECRET` | Same place |
| `SHOPIFY_APP_URL` | `https://<your-project>.vercel.app` (no trailing slash) |
| `SCOPES` | `read_orders,read_returns,read_products,read_customers` |
| `BILLING_TEST` | `true` for dev/partner stores; `false` for live merchants |

### Database URL for serverless

Vercel runs serverless functions. Prefer a **pooled** connection:

**Supabase (recommended if you already use it):**

- Runtime (`DATABASE_URL`): Transaction pooler, port **6543**
- Migrations during build: Session pooler, port **5432** (set as `DATABASE_URL` in Vercel — migrations run in `vercel-build`)

Example runtime URL:

```txt
postgresql://postgres.<ref>:<password>@<region>.pooler.supabase.com:6543/postgres?sslmode=require
```

**Vercel Postgres:** use `POSTGRES_PRISMA_URL` (pooled) and point `DATABASE_URL` to the same value, or follow [Prisma + Vercel docs](https://www.prisma.io/docs/orm/prisma-client/deployment/serverless/deploy-to-vercel).

## 5. Update Shopify Partner URLs

After the first deploy, copy your Vercel URL (e.g. `https://return-guard-ai.vercel.app`).

**Apps → ReturnGuard AI → Configuration:**

- **App URL:** `https://<your-project>.vercel.app`
- **Allowed redirection URL(s):**
  - `https://<your-project>.vercel.app/auth/callback`
  - `https://<your-project>.vercel.app/auth/shopify/callback`
  - `https://<your-project>.vercel.app/api/auth/callback`

Update `shopify.app.toml` and push, then run:

```bash
npm run deploy
```

This syncs webhook URLs and redirect URLs with Shopify.

## 6. Deploy

Push to `main` (or click **Deploy** in Vercel). The build runs:

```bash
npm ci --legacy-peer-deps
npm run vercel-build   # prisma migrate deploy + remix vite:build
```

## 7. Verify

1. Open `https://<your-project>.vercel.app` — landing page loads.
2. Install on a dev store via the install form.
3. Open the app in Shopify Admin — embedded UI works.
4. Trigger a webhook (e.g. order create) — check Vercel **Functions** logs for 200 responses.
5. **Billing** page shows **Test mode** when `BILLING_TEST=true`.

## 8. Shut down Render (optional)

After Vercel is stable:

1. Confirm Shopify URLs point to Vercel only.
2. Delete or suspend the Render web service to avoid duplicate webhooks.
3. Keep the same Postgres database — no data migration needed if you reuse `DATABASE_URL`.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Prisma session table does not exist` | Ensure `DATABASE_URL` is set and `vercel-build` completed migrations (check build logs). |
| OAuth loop / login page in iframe | Disable Vercel Authentication; check `SHOPIFY_APP_URL` matches the Vercel domain exactly. |
| `ReadableStream` / streaming errors | Project uses `@vercel/remix` preset — redeploy after pulling latest code. |
| DB connection timeouts (P2024) | Use Supabase transaction pooler (6543) or increase pool size on Vercel Postgres. |
| Billing test errors | Match `BILLING_TEST` to store type (dev store → `true`). |

## Local development (unchanged)

Local dev still uses SQLite:

```bash
npm run setup:dev
npm run dev
```

Production builds on Vercel use `prisma-postgres/schema.prisma` via `vercel-build`.
