# ReturnGuard AI — Agent Instructions

## Cursor Cloud specific instructions

ReturnGuard AI is a Shopify embedded app built with **Remix v2 + Vite + Prisma (SQLite)**. See `README.md` for standard commands (`npm run lint`, `npm run build`, etc.).

### Running the dev server (no Shopify auth)

```shell
npm exec remix vite:dev -- --host 127.0.0.1 --port 3000
```

This starts the Remix/Vite dev server in local mode, serving the landing page at `http://127.0.0.1:3000/`. Shopify-embedded admin routes require OAuth and will not work without `shopify app dev`.

### Database

SQLite via Prisma — no external database service needed. The file lives at `prisma/dev.sqlite`. Run `npm run setup` to regenerate the Prisma client and apply migrations after schema changes.

### Known warnings

- Polaris CSS produces an esbuild `css-syntax-error` warning for a generated media query during build — this is expected and harmless.
- `@remix-run/eslint-config` deprecation notice on lint — also expected.
- `npm audit` reports advisories inherited from Shopify/Remix template dependencies.

### Checks

```shell
npx tsc --noEmit   # type-check
npm run lint        # eslint
npm run build       # production build
```

### Full embedded-app mode

Requires Shopify CLI auth + a development store. Uses `npm run dev` which calls `shopify app dev`. This is not available in Cloud Agent environments without Shopify credentials.
