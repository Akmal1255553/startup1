import {
  actionFailure,
  type ActionFailure,
} from "./action-result";

/**
 * Soft cap for form bodies on mutation endpoints.
 * Shopify admin requests are tiny; anything larger is almost certainly
 * malicious or a misconfigured client.
 */
const MAX_FORM_BODY_BYTES = 1_000_000;

/**
 * Thrown by validation helpers. Routes should catch and convert to
 * `ActionFailure` via {@link toActionFailure}.
 */
export class ValidationError extends Error {
  fieldErrors?: Record<string, string>;

  constructor(message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Read FormData with a hard size cap. Throws ValidationError instead of a
 * raw 413 so it shows up uniformly in the UI.
 */
export async function readSafeFormData(request: Request): Promise<FormData> {
  const headerLength = Number(request.headers.get("content-length") || 0);
  if (headerLength && headerLength > MAX_FORM_BODY_BYTES) {
    throw new ValidationError("Request payload is too large.");
  }
  return request.formData();
}

export function readString(
  formData: FormData,
  key: string,
  options: {
    required?: boolean;
    max?: number;
    min?: number;
    trim?: boolean;
    toLowerCase?: boolean;
  } = {},
): string {
  let value = String(formData.get(key) ?? "");
  if (options.trim !== false) value = value.trim();
  if (options.toLowerCase) value = value.toLowerCase();

  if (options.required && !value) {
    throw new ValidationError(`Missing "${key}".`, { [key]: "Required" });
  }
  if (
    options.min !== undefined &&
    value.length > 0 &&
    value.length < options.min
  ) {
    throw new ValidationError(`"${key}" is too short.`, {
      [key]: `Minimum ${options.min} characters`,
    });
  }
  if (options.max !== undefined && value.length > options.max) {
    value = value.slice(0, options.max);
  }
  return value;
}

export function readEnum<T extends string>(
  formData: FormData,
  key: string,
  allowed: readonly T[],
  options: { required?: boolean; default?: T } = {},
): T | null {
  const raw = String(formData.get(key) ?? "");
  if ((allowed as readonly string[]).includes(raw)) return raw as T;
  if (options.default !== undefined) return options.default;
  if (options.required) {
    throw new ValidationError(`Invalid value for "${key}".`, {
      [key]: `Must be one of: ${allowed.join(", ")}`,
    });
  }
  return null;
}

export function readNullableInt(
  formData: FormData,
  key: string,
  options: { min?: number; max?: number } = {},
): number | null {
  const raw = formData.get(key);
  if (raw === null || raw === "") return null;
  const num = Number(raw);
  if (!Number.isFinite(num)) {
    throw new ValidationError(`"${key}" must be a number.`, {
      [key]: "Must be a number",
    });
  }
  let result = Math.round(num);
  if (options.min !== undefined) result = Math.max(options.min, result);
  if (options.max !== undefined) result = Math.min(options.max, result);
  return result;
}

export function readBool(
  formData: FormData,
  key: string,
  options: { default?: boolean } = {},
): boolean {
  const raw = formData.get(key);
  if (raw === null) return options.default ?? false;
  const v = String(raw).toLowerCase();
  return v === "true" || v === "1" || v === "on";
}

export function readStringArray(
  formData: FormData,
  key: string,
  options: { max?: number; itemMax?: number } = {},
): string[] {
  const all = formData
    .getAll(key)
    .map((value) => String(value).trim())
    .filter(Boolean);
  const sliced = options.max ? all.slice(0, options.max) : all;
  if (options.itemMax !== undefined) {
    return sliced.filter((value) => value.length <= (options.itemMax as number));
  }
  return sliced;
}

export function toActionFailure(error: unknown): ActionFailure {
  if (error instanceof ValidationError) {
    return actionFailure(error.message, error.fieldErrors);
  }
  if (error instanceof Error) {
    return actionFailure(error.message);
  }
  return actionFailure("Unexpected server error.");
}
