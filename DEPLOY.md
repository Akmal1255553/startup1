# Deploy ReturnGuard AI to Render

## 1. Push latest code

```bash
git add -A
git commit -m "i18n: full app pages, landing install form, deploy docs"
git push origin main
```

Render deploys automatically when `main` updates (if the service is linked to GitHub).

## 2. Render environment variables

In **Render Dashboard → your Web Service → Environment**, set:

| Variable | Value |
|----------|--------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | PostgreSQL connection string (Render Postgres or external) |
| `SHOPIFY_API_KEY` | From Partner Dashboard → App → Client credentials |
| `SHOPIFY_API_SECRET` | Same place |
| `SHOPIFY_APP_URL` | `https://<your-service>.onrender.com` (no trailing slash) |
| `SCOPES` | `read_orders,read_returns,read_products,read_customers` |
| `BILLING_TEST` | `true` while you use **development / partner test stores** |

After App Store approval and installs on **live merchant stores**, set `BILLING_TEST=false`.

## 3. Shopify Partner app URLs

**Apps → ReturnGuard AI → Configuration:**

- **App URL:** `https://<your-service>.onrender.com`
- **Allowed redirection URL(s):**
  - `https://<your-service>.onrender.com/auth/callback`
  - `https://<your-service>.onrender.com/auth/shopify/callback`
  - `https://<your-service>.onrender.com/api/auth/callback`

Run **Deploy** on Render after changing env vars.

## 4. Database

First deploy (or after schema changes), migrations run via `npm run setup:prod` in the Render build command (`render.yaml`).

## 5. Billing test mode (Shopify)

The app sends `isTest: true` to Shopify Billing when `BILLING_TEST=true`.

- **Development / partner stores** → must use test charges → `BILLING_TEST=true`
- **Live production stores** → real charges → `BILLING_TEST=false`

If subscribe fails with “test” / “development store” errors, check this flag matches your store type.

### Partner Dashboard

1. **Distribution → Public distribution** (required for Billing API on many installs; App Store listing can stay draft).
2. **Pricing** → recurring plans must match app code (`starter`, `growth`, `scale`).

## 6. Verify after deploy

1. Open `https://<your-service>.onrender.com` — landing has EN/RU switcher, no pre-filled dev store domain.
2. Install with your store’s `*.myshopify.com` domain.
3. In the embedded app, switch language (RU) — dashboard, queue, billing follow locale.
4. **Billing** page shows **Test mode** badge when `BILLING_TEST=true`.

## 7. Manual deploy trigger

Render → service → **Manual Deploy → Deploy latest commit**.
