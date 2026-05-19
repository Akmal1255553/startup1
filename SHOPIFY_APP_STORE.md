# Publish ReturnGuard AI on the Shopify App Store

This guide is for going live as a **public Shopify app** (not only a dev store on Render).

## Prerequisites

- [Shopify Partner](https://partners.shopify.com) account  
- Production app URL (e.g. Render) with HTTPS  
- Privacy policy URL (your `/privacy` page on the same domain)  
- Support contact (your `/support` page or email)  
- App icon, screenshots, and listing copy (EN; add other languages in Partner Dashboard if you want)

## 1. Production hosting

1. Deploy the app to Render (or similar) — see [DEPLOY.md](./DEPLOY.md).  
2. Set environment variables:
   - `SHOPIFY_APP_URL` = `https://your-app.onrender.com`
   - `NODE_ENV` = `production`
   - `DATABASE_URL`, `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SCOPES`
   - **`BILLING_TEST=false`** when you charge **live** merchant stores (keep `true` only for dev/partner test stores)

## 2. Partner Dashboard — app setup

**Apps → ReturnGuard AI → Configuration**

| Field | Value |
|--------|--------|
| App URL | `https://your-app.onrender.com` |
| Allowed redirection URL(s) | `https://your-app.onrender.com/auth/callback`, `.../auth/shopify/callback`, `.../api/auth/callback` |
| Embedded app | Enabled |
| App proxy | Off (unless you add one later) |

**API access / Scopes** (must match `SCOPES` in Render):

- `read_orders`, `read_returns`, `read_products`, `read_customers`

If you use **Protected Customer Data**, complete that request in Partners and reinstall on test stores before review.

## 3. Distribution — required for Billing API

**Apps → Distribution → Public distribution**

- Choose **Public distribution** (not Custom-only).  
- You can submit for review before the listing is “perfect”; billing and installs on merchant stores depend on this for many setups.

## 4. Pricing (managed in code + Partner)

1. **Apps → Pricing** — define recurring plans that match code plan IDs: `starter`, `growth`, `scale`.  
2. Prices and trial (21 days) should match `app/billing/plans.ts`.  
3. On production with live stores: `BILLING_TEST=false`.

## 5. App Store listing

**Apps → App Store listing**

Fill in:

- **App name** — ReturnGuard AI  
- **Tagline** — short value proposition  
- **Description** — features: return queue, risk scoring, playbooks, audit log, analytics  
- **App icon** — 1200×1200 px  
- **Screenshots** — embedded app (dashboard, queue, settings, billing)  
- **Privacy policy URL** — `https://your-app.onrender.com/privacy`  
- **Support** — `https://your-app.onrender.com/support` or support email  
- **Pricing details** — link to your plans / trial  
- **Install requirements** — scopes listed above  

Optional: add **listing translations** (ES, DE, FR, etc.) in the Partner UI — your app UI already supports those locales.

## 6. Compliance checklist (common review blockers)

- [ ] Privacy policy explains what order/return/customer data you read and how long you store it  
- [ ] GDPR webhooks implemented (`customers/data_request`, `customers/redact`, `shop/redact`) — already in this repo  
- [ ] App works on a **clean dev store** after install (OAuth, embedded load, queue loads)  
- [ ] Billing: test subscribe on dev store with `BILLING_TEST=true`; document test charge in review notes  
- [ ] No hardcoded single-store install on the marketing site  
- [ ] Support URL or email responds within stated SLA  

## 7. Submit for review

1. **Apps → Distribution → Submit app** (or **Create version** → submit).  
2. In **Testing instructions**, provide:
   - Dev store URL you used  
   - Steps: Install → open app → view queue → save a decision → optional: start trial on Billing  
   - Login: Partner staff access or collaborator on the test store  
3. Wait for Shopify review (often several business days). Address feedback in Partner Dashboard.

## 8. After approval

1. Set `BILLING_TEST=false` on Render for production merchants.  
2. Monitor errors (Render logs, optional Sentry).  
3. Update listing when you ship major features.  

## 9. `shopify app deploy` (CLI) vs Render

- **Render** runs the Node server (`npm run start`) — this is your production backend.  
- **Shopify CLI** (`shopify app deploy`) updates app config/extensions in Partners; run locally when you change `shopify.app.toml` or extensions.  
- After changing app URL or scopes in TOML, deploy config and reinstall on test stores.

```bash
cd return-guard-ai
shopify app deploy
```

Ensure `shopify.app.toml` `application_url` matches `SHOPIFY_APP_URL` on Render.

## Quick reference

| Goal | Action |
|------|--------|
| Test on dev store | Install from Partners; `BILLING_TEST=true` |
| Public merchants | Public distribution + approved listing + `BILLING_TEST=false` |
| Update code | Push to GitHub → Render auto-deploy |
| Update Partners config | `shopify app deploy` + verify URLs |
