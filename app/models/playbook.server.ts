import prisma from "../db.server";

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

export async function listPlaybooks(shop: string) {
  return prisma.playbook.findMany({
    where: { shop },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });
}

export async function createPlaybook(shop: string, formData: FormData) {
  const input = parsePlaybookInput(formData);
  await prisma.playbook.create({
    data: {
      shop,
      ...input,
    },
  });
}

export async function updatePlaybook(shop: string, formData: FormData) {
  const id = readRequiredString(formData, "id");
  const input = parsePlaybookInput(formData);
  await prisma.playbook.updateMany({
    where: { id, shop },
    data: input,
  });
}

export async function togglePlaybook(shop: string, formData: FormData) {
  const id = readRequiredString(formData, "id");
  const nextValue = readBoolean(formData.get("isActive"));
  await prisma.playbook.updateMany({
    where: { id, shop },
    data: { isActive: nextValue },
  });
}

export async function deletePlaybook(shop: string, formData: FormData) {
  const id = readRequiredString(formData, "id");
  await prisma.playbook.deleteMany({
    where: { id, shop },
  });
}

function parsePlaybookInput(formData: FormData): PlaybookInput {
  const action = readAction(formData.get("action"));
  const name = readRequiredString(formData, "name");
  return {
    name: name.slice(0, 80),
    notes: String(formData.get("notes") || "").trim().slice(0, 500),
    isActive: readBoolean(formData.get("isActive"), true),
    action,
    minOrderValue: readNullableInt(formData.get("minOrderValue"), {
      min: 0,
      max: 1_000_000,
    }),
    suspiciousDomainsCsv: normalizeDomainsCsv(
      String(formData.get("suspiciousDomainsCsv") || ""),
    ),
    repeatReturnsThreshold: readNullableInt(
      formData.get("repeatReturnsThreshold"),
      { min: 1, max: 1000 },
    ),
    minAccountAgeDays: readNullableInt(formData.get("minAccountAgeDays"), {
      min: 0,
      max: 36500,
    }),
    vipBypassEnabled: readBoolean(formData.get("vipBypassEnabled")),
  };
}

function readRequiredString(formData: FormData, key: string) {
  const value = String(formData.get(key) || "").trim();
  if (!value) {
    throw new Response(`Missing "${key}"`, { status: 400 });
  }
  return value;
}

function readNullableInt(
  value: FormDataEntryValue | null,
  bounds: { min: number; max: number },
) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const normalized = Math.round(parsed);
  return Math.max(bounds.min, Math.min(bounds.max, normalized));
}

function readBoolean(value: FormDataEntryValue | null, fallback = false) {
  if (value === null) return fallback;
  const normalized = String(value).toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "on";
}

function readAction(value: FormDataEntryValue | null): PlaybookAction {
  const normalized = String(value || "");
  if (normalized === "approved") return "approved";
  if (normalized === "review") return "review";
  if (normalized === "hold") return "hold";
  throw new Response("Invalid playbook action", { status: 400 });
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
