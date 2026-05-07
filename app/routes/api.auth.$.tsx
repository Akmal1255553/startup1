import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const authPath = params["*"] || "callback";

  throw redirect(`/auth/${authPath}?${url.searchParams.toString()}`);
};
