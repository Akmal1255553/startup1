/** @type {import('@types/eslint').Linter.BaseConfig} */
module.exports = {
  root: true,
  extends: [
    "@remix-run/eslint-config",
    "@remix-run/eslint-config/node",
    "@remix-run/eslint-config/jest-testing-library",
    "prettier",
  ],
  globals: {
    shopify: "readonly"
  },
  // We use Vitest, not Jest. The Remix preset enables eslint-plugin-jest,
  // which crashes trying to detect a Jest version that isn't installed.
  // Pinning the version is enough to keep its lint rules running.
  settings: {
    jest: {
      version: 29,
    },
  },
};
