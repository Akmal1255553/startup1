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
import { loadAuditLog } from "../models/audit-log.server";
import { deleteDecisionEvent } from "../models/return-risk.server";
import { getDecisionLabel, getDecisionTone } from "../models/return-risk";
import { readSafeFormData, toActionFailure } from "../lib/validation.server";
import { loadCapabilities } from "../models/plan-gating.server";
import { actionFailure } from "../lib/action-result";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  const capabilities = await loadCapabilities(billing);
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
  const { session, billing } = await authenticate.admin(request);
  const capabilities = await loadCapabilities(billing);
  if (!capabilities.canUseAuditLog) {
    return actionFailure(
      "Audit log is available on the Growth and Scale plans.",
    );
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
        title="Audit Log"
        subtitle="Decision history for refund moderation, bulk actions, and review changes"
        backAction={{ content: "Dashboard", url: "/app" }}
      >
        <TitleBar title="Audit Log" />
        <Banner
          title="Audit Log is a Growth feature"
          tone="warning"
          action={{ content: "Open billing", url: "/app/billing" }}
        >
          <p>
            You're on {capabilities.planLabel}. Upgrade to Growth or Scale to
            unlock the full decision history with search, filters, and
            removable events.
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
        {event.returnId ? "Return-level action" : "Order-level action"}
      </Text>
    </BlockStack>,
    <InlineStack key={`${event.id}-decision`} gap="200" blockAlign="center">
      {event.previousDecision ? (
        <Badge tone="info" toneAndProgressLabelOverride=" ">
          {getDecisionLabel(event.previousDecision)}
        </Badge>
      ) : null}
      <Badge
        tone={getDecisionTone(event.decision)}
        toneAndProgressLabelOverride=" "
      >
        {getDecisionLabel(event.decision)}
      </Badge>
    </InlineStack>,
    event.risk === null ? "-" : String(event.risk),
    new Date(event.createdAt).toLocaleString("en-US"),
    <DeleteEventForm key={`${event.id}-delete`} eventId={event.id} />,
  ]);

  return (
    <Page
      title="Audit Log"
      subtitle="Decision history for refund moderation, bulk actions, and review changes"
      backAction={{ content: "Dashboard", url: "/app" }}
      secondaryActions={[{ content: "Open queue", url: "/app/returns" }]}
    >
      <TitleBar title="Audit Log" />
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
                  label="Search audit log"
                  labelHidden
                  autoComplete="off"
                  placeholder="Search order, return, or id"
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
                      Search
                    </Button>
                  }
                />
              </Box>
              <InlineStack gap="200">
                <Select
                  label="Decision"
                  labelHidden
                  options={[
                    { label: "All decisions", value: "all" },
                    { label: "Approved", value: "approved" },
                    { label: "Review", value: "review" },
                    { label: "Hold", value: "hold" },
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
                  label="Page size"
                  labelHidden
                  options={[
                    { label: "10 per page", value: "10" },
                    { label: "25 per page", value: "25" },
                    { label: "50 per page", value: "50" },
                    { label: "100 per page", value: "100" },
                  ]}
                  value={String(pageSize)}
                  onChange={(value) =>
                    navigateWithParams({ pageSize: value, page: null })
                  }
                />
              </InlineStack>
            </InlineStack>
            <Text as="p" variant="bodySm" tone="subdued">
              {total} audit event{total === 1 ? "" : "s"} found.
            </Text>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            {events.length ? (
              <DataTable
                columnContentTypes={["text", "text", "numeric", "text", "text"]}
                headings={["Subject", "Decision", "Risk", "Created", ""]}
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
                  No audit events match these filters.
                </Text>
              </Box>
            )}
            <InlineStack align="space-between" blockAlign="center">
              <Text as="span" variant="bodySm" tone="subdued">
                Page {page} of {totalPages}
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
  return (
    <Form
      method="post"
      onSubmit={(event) => {
        if (!window.confirm("Delete this audit event?")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="eventId" value={eventId} />
      <Button submit tone="critical" variant="tertiary" size="micro">
        Delete
      </Button>
    </Form>
  );
}
