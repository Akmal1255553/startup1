import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  DataTable,
  InlineStack,
  Page,
  Pagination,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { useEffect, useState } from "react";

import { authenticate } from "../shopify.server";
import { getDateLocale } from "../i18n/date-locale";
import { useI18n } from "../i18n/i18n-context";
import { describePlanContext } from "../i18n/messages/app/common";
import { getAuditCopy } from "../i18n/messages/app/audit";
import { resolveLocale } from "../i18n/resolver.server";
import { loadAuditLog } from "../models/audit-log.server";
import { deleteDecisionEvent } from "../models/return-risk.server";
import { getDecisionLabel, getDecisionTone } from "../models/return-risk";
import { readSafeFormData, toActionFailure } from "../lib/validation.server";
import { loadCapabilities } from "../models/plan-gating.server";
import { actionFailure } from "../lib/action-result";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, billing, admin } = await authenticate.admin(request);
  const capabilities = await loadCapabilities(billing, session.shop, admin);
  const url = new URL(request.url);

  if (!capabilities.canUseAuditLog) {
    return {
      capabilities,
      gated: true as const,
      decision: "all" as const,
      events: [] as Awaited<ReturnType<typeof loadAuditLog>>["events"],
      page: 1,
      pageSize: 25,
      query: "",
      total: 0,
      totalPages: 1,
    };
  }

  const data = await loadAuditLog(session.shop, {
    decision: url.searchParams.get("decision"),
    page: Number(url.searchParams.get("page")) || 1,
    pageSize: Number(url.searchParams.get("pageSize")) || 25,
    query: url.searchParams.get("q"),
  });

  return { ...data, capabilities, gated: false as const };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, billing, admin } = await authenticate.admin(request);
  const capabilities = await loadCapabilities(billing, session.shop, admin);
  const locale = await resolveLocale(request, {
    authenticatedShop: session.shop,
    sessionLocale: session.locale ?? null,
  });
  if (!capabilities.canUseAuditLog) {
    return actionFailure(getAuditCopy(locale).errorGated);
  }

  try {
    const formData = await readSafeFormData(request);
    return await deleteDecisionEvent(session.shop, formData);
  } catch (error) {
    return toActionFailure(error);
  }
};

export default function AuditLogPage() {
  const loaderData = useLoaderData<typeof loader>();
  const {
    pages: { audit: a, common: c },
    locale,
  } = useI18n();
  const dateLocale = getDateLocale(locale);
  const {
    decision,
    events,
    page,
    pageSize,
    query,
    total,
    totalPages,
    capabilities,
    gated,
  } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shopify = useAppBridge();
  const [searchValue, setSearchValue] = useState(query);
  const isLoading = navigation.state === "loading";

  if (gated) {
    return (
      <Page
        title={a.title}
        subtitle={a.subtitle}
        backAction={{ content: c.backDashboard, url: "/app" }}
      >
        <TitleBar title={a.title} />
        <Banner
          title={a.gatedTitle}
          tone="warning"
          action={{ content: c.openBilling, url: "/app/billing" }}
        >
          <p>
            {describePlanContext(
              c,
              capabilities.planLabel,
              capabilities.hasActivePlan,
            )}{" "}
            {a.gatedBody}
          </p>
        </Banner>
      </Page>
    );
  }

  useEffect(() => {
    if (actionData && actionData.ok && actionData.toast) {
      shopify.toast.show(actionData.toast);
    }
  }, [actionData, shopify.toast]);

  const navigateWithParams = (overrides: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(overrides)) {
      if (!value) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    navigate(`?${next.toString()}`);
  };

  const rows = events.map((event) => [
    <BlockStack key={`${event.id}-subject`} gap="050">
      <Text as="span" variant="bodyMd">
        {event.label}
      </Text>
      <Text as="span" variant="bodySm" tone="subdued">
        {event.returnId ? a.rowReturnLevel : a.rowOrderLevel}
      </Text>
    </BlockStack>,
    <InlineStack key={`${event.id}-decision`} gap="200" blockAlign="center">
      {event.previousDecision ? (
        <Badge tone="info" toneAndProgressLabelOverride=" ">
          {getDecisionLabel(event.previousDecision, locale)}
        </Badge>
      ) : null}
      <Badge
        tone={getDecisionTone(event.decision)}
        toneAndProgressLabelOverride=" "
      >
        {getDecisionLabel(event.decision, locale)}
      </Badge>
    </InlineStack>,
    event.risk === null ? "-" : String(event.risk),
    new Date(event.createdAt).toLocaleString(dateLocale),
    <DeleteEventForm key={`${event.id}-delete`} eventId={event.id} />,
  ]);

  return (
    <Page
      title={a.title}
      subtitle={a.subtitle}
      backAction={{ content: c.backDashboard, url: "/app" }}
      secondaryActions={[{ content: c.openQueue, url: "/app/returns" }]}
    >
      <TitleBar title={a.title} />
      <BlockStack gap="500">
        {actionData && !actionData.ok ? (
          <Card>
            <Text as="p" variant="bodyMd" tone="critical">
              {actionData.error}
            </Text>
          </Card>
        ) : null}

        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <Box minWidth="320px">
                <TextField
                  label={a.searchLabel}
                  labelHidden
                  autoComplete="off"
                  placeholder={a.searchPlaceholder}
                  value={searchValue}
                  onChange={setSearchValue}
                  connectedRight={
                    <Button
                      loading={isLoading}
                      onClick={() =>
                        navigateWithParams({
                          q: searchValue.trim() || null,
                          page: null,
                        })
                      }
                    >
                      {c.search}
                    </Button>
                  }
                />
              </Box>
              <InlineStack gap="200">
                <Select
                  label={a.filterDecision}
                  labelHidden
                  options={[
                    { label: a.filterAll, value: "all" },
                    { label: a.filterApproved, value: "approved" },
                    { label: a.filterReview, value: "review" },
                    { label: a.filterHold, value: "hold" },
                  ]}
                  value={decision}
                  onChange={(value) =>
                    navigateWithParams({
                      decision: value === "all" ? null : value,
                      page: null,
                    })
                  }
                />
                <Select
                  label={c.pageSize}
                  labelHidden
                  options={[
                    { label: c.perPage(10), value: "10" },
                    { label: c.perPage(25), value: "25" },
                    { label: c.perPage(50), value: "50" },
                    { label: c.perPage(100), value: "100" },
                  ]}
                  value={String(pageSize)}
                  onChange={(value) =>
                    navigateWithParams({ pageSize: value, page: null })
                  }
                />
              </InlineStack>
            </InlineStack>
            <Text as="p" variant="bodySm" tone="subdued">
              {a.eventsFound(total)}
            </Text>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            {events.length ? (
              <DataTable
                columnContentTypes={["text", "text", "numeric", "text", "text"]}
                headings={[
                  a.colSubject,
                  a.colDecision,
                  a.colRisk,
                  a.colCreated,
                  "",
                ]}
                rows={rows}
                increasedTableDensity
              />
            ) : (
              <Box
                padding="600"
                background="bg-surface-active"
                borderRadius="200"
              >
                <Text as="p" variant="bodyMd" tone="subdued">
                  {a.empty}
                </Text>
              </Box>
            )}
            <InlineStack align="space-between" blockAlign="center">
              <Text as="span" variant="bodySm" tone="subdued">
                {a.pageOf(page, totalPages)}
              </Text>
              <Pagination
                hasPrevious={page > 1}
                onPrevious={() =>
                  navigateWithParams({ page: String(Math.max(1, page - 1)) })
                }
                hasNext={page < totalPages}
                onNext={() =>
                  navigateWithParams({
                    page: String(Math.min(totalPages, page + 1)),
                  })
                }
              />
            </InlineStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}

function DeleteEventForm({ eventId }: { eventId: string }) {
  const {
    pages: { audit: a },
  } = useI18n();
  return (
    <Form
      method="post"
      onSubmit={(event) => {
        if (!window.confirm(a.deleteConfirm)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="eventId" value={eventId} />
      <Button submit tone="critical" variant="tertiary" size="micro">
        {a.delete}
      </Button>
    </Form>
  );
}
