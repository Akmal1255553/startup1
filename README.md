# ReturnGuard AI

ReturnGuard AI is a Shopify embedded app concept for returns intelligence. It
scores risky return requests, gives support teams a review queue, and presents a
clean product-style landing page for demos.

## Local startup demo

Use this when you want the project to look like a polished standalone startup
site in the browser.

```shell
npm install
npm exec remix vite:dev -- --host 127.0.0.1 --port 3000
```

Open http://127.0.0.1:3000/.

The local landing page uses development fallback values for Shopify credentials,
so it can render without a tunnel. Real Shopify Admin routes still need Shopify
authentication.

## Shopify embedded app demo

Use this when you want to show the real app inside Shopify Admin.

```shell
npm install
npm run setup
npm run dev
```

The `dev` script runs:

```shell
shopify app dev --store store-fbugaeho.myshopify.com
```

Shopify CLI will log you in, create a tunnel, inject environment variables, and
open the embedded app flow for the configured development store.

## Checks

```shell
npx tsc --noEmit
npm run lint
npm run build
```

Current known warnings:

- Polaris CSS produces an esbuild minify warning for a generated media query.
- `npm audit` reports dependency advisories inherited from the Shopify/Remix
  template. `npm audit fix` cannot safely resolve all of them without breaking
  upgrades.
