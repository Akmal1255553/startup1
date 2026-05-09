import prisma from "../db.server";
import {
  ValidationError,
  readBool,
  readEnum,
  readNullableInt,
  readString,
} from "../lib/validation.server";
import {
  actionSuccess,
  type ActionResult,
} from "../lib/action-result";

export type PlaybookAction = "approved" | "review" | "hold";

export type PlaybookInput = {
  name: string;
  notes: string;
  isActive: boolean;
  action: PlaybookAction;
  minOrderValue: number | null;
  suspiciousDomainsCsv: string;
  repeatReturnsThreshold: number | null;
  minAccountAgeDays: number | null;
  vipBypassEnabled: boolean;
};

const ALLOWED_ACTIONS = ["approved", "review", "hold"] as const;

export async function listPlaybooks(shop: string) {
  return prisma.playbook.findMany({
    where: { shop },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });
}

export async function createPlaybook(
  shop: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const input = parsePlaybookInput(formData);
  const created = await prisma.playbook.create({
    data: { shop, ...input },
    select: { id: true },
  });
  return actionSuccess(created, { toast: "Playbook created" });
}

export async function updatePlaybook(
  shop: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const id = readString(formData, "id", { required: true, max: 64 });
  const input = parsePlaybookInput(formData);
  const result = await prisma.playbook.updateMany({
    where: { id, shop },
    data: input,
  });
  if (result.count === 0) {
    throw new ValidationError("Playbook not found.");
  }
  return actionSuccess({ id }, { toast: "Playbook updated" });
}

export async function togglePlaybook(
  shop: string,
  formData: FormData,
): Promise<ActionResult<{ id: string; isActive: boolean }>> {
  const id = readString(formData, "id", { required: true, max: 64 });
  const isActive = readBool(formData, "isActive");
  const result = await prisma.playbook.updateMany({
    where: { id, shop },
    data: { isActive },
  });
  if (result.count === 0) {
    throw new ValidationError("Playbook not found.");
  }
  return actionSuccess({ id, isActive }, {
    toast: isActive ? "Playbook activated" : "Playbook paused",
  });
}

export async function deletePlaybook(
  shop: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const id = readString(formData, "id", { required: true, max: 64 });
  const result = await prisma.playbook.deleteMany({
    where: { id, shop },
  });
  if (result.count === 0) {
    throw new ValidationError("Playbook not found.");
  }
  return actionSuccess({ id }, { toast: "Playbook deleted" });
}

function parsePlaybookInput(formData: FormData): PlaybookInput {
  const action = readEnum<PlaybookAction>(formData, "action", ALLOWED_ACTIONS, {
    required: true,
  });
  // `required: true` guarantees a non-null value, but TS narrowing keeps null
  // in the union — assert for the rest of the function.
  if (!action) {
    throw new ValidationError("Missing playbook action.", {
      action: "Required",
    });
  }

  const name = readString(formData, "name", {
    required: true,
    max: 80,
    min: 2,
  });

  return {
    name,
    notes: readString(formData, "notes", { max: 500 }),
    isActive: readBool(formData, "isActive", { default: true }),
    action,
    minOrderValue: readNullableInt(formData, "minOrderValue", {
      min: 0,
      max: 1_000_000,
    }),
    suspiciousDomainsCsv: normalizeDomainsCsv(
      readString(formData, "suspiciousDomainsCsv", { max: 500 }),
    ),
    repeatReturnsThreshold: readNullableInt(formData, "repeatReturnsThreshold", {
      min: 1,
      max: 1000,
    }),
    minAccountAgeDays: readNullableInt(formData, "minAccountAgeDays", {
      min: 0,
      max: 36500,
    }),
    vipBypassEnabled: readBool(formData, "vipBypassEnabled"),
  };
}

function normalizeDomainsCsv(value: string) {
  const normalized = value
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean)
    .map((domain) => domain.replace(/^@/, ""))
    .filter((domain) => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain));
  return Array.from(new Set(normalized)).join(", ");
}
