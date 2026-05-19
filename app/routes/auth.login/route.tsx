import { useEffect, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import {
  AppProvider as PolarisAppProvider,
  Button,
  Card,
  FormLayout,
  Page,
  Text,
  TextField,
} from "@shopify/polaris";
import polarisTranslations from "@shopify/polaris/locales/en.json";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

import { normalizeShopDomain } from "../../lib/shop-domain.server";
import { login } from "../../shopify.server";

import { loginErrorMessage } from "./error.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

async function runLogin(request: Request): Promise<never | ReturnType<typeof loginErrorMessage>> {
  try {
    return loginErrorMessage(await login(request));
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    throw error;
  }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shopFromQuery = url.searchParams.get("shop") ?? "";

  // Auto-start OAuth when opened with ?shop= (e.g. from marketing install link).
  if (request.method === "GET" && shopFromQuery) {
    const errors = await runLogin(request);
    return {
      errors,
      shop: shopFromQuery,
      polarisTranslations,
    };
  }

  return {
    errors: {},
    shop: shopFromQuery,
    polarisTranslations,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const rawShop = String(formData.get("shop") ?? "");
  const normalized = normalizeShopDomain(rawShop);

  if (!normalized) {
    return {
      errors: { shop: "Please enter your shop domain to log in" },
      shop: rawShop,
    };
  }

  // login() reads shop from the query string on GET; avoids consuming formData twice.
  const url = new URL(request.url);
  url.searchParams.set("shop", normalized);
  const loginRequest = new Request(url.toString(), {
    method: "GET",
    headers: request.headers,
  });

  const errors = await runLogin(loginRequest);
  return {
    errors,
    shop: rawShop || normalized,
  };
};

export default function Auth() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const initialShop = actionData?.shop ?? loaderData.shop ?? "";
  const [shop, setShop] = useState(initialShop);
  const errors = actionData?.errors ?? loaderData.errors;

  useEffect(() => {
    setShop(initialShop);
  }, [initialShop]);

  return (
    <PolarisAppProvider i18n={loaderData.polarisTranslations}>
      <Page>
        <Card>
          <Form method="post">
            <FormLayout>
              <Text variant="headingMd" as="h2">
                Log in
              </Text>
              <TextField
                type="text"
                label="Shop domain"
                helpText="Example: your-store.myshopify.com (not your .com storefront URL)."
                value={shop}
                onChange={setShop}
                autoComplete="on"
                error={errors.shop}
              />
              {/* Polaris controlled fields may not submit via native form POST. */}
              <input type="hidden" name="shop" value={shop} />
              <Button submit>Log in</Button>
            </FormLayout>
          </Form>
        </Card>
      </Page>
    </PolarisAppProvider>
  );
}
