/**
 * Unified action envelope used across server mutations.
 *
 * Routes return this shape from their `action` so the UI has a single,
 * predictable surface for handling success / error / field-level errors.
 *
 * Keep this file UI-safe (no server-only imports). It is consumed by both
 * server actions and React components.
 */
export type ActionSuccess<T> = {
  ok: true;
  data?: T;
  toast?: string;
};

export type ActionFailure = {
  ok: false;
  error: string;
  fieldErrors?: Record<string, string>;
};

export type ActionResult<T = undefined> = ActionSuccess<T> | ActionFailure;

export function actionSuccess<T>(
  data?: T,
  options: { toast?: string } = {},
): ActionSuccess<T> {
  return { ok: true, data, toast: options.toast };
}

export function actionFailure(
  error: string,
  fieldErrors?: Record<string, string>,
): ActionFailure {
  return { ok: false, error, fieldErrors };
}

export function isActionFailure(
  result: ActionResult<unknown> | undefined | null,
): result is ActionFailure {
  return Boolean(result && result.ok === false);
}

export function getActionToast(
  result: ActionResult<unknown> | undefined | null,
): string | null {
  if (!result || !result.ok) return null;
  return result.toast || null;
}

export function getFieldError(
  result: ActionResult<unknown> | undefined | null,
  field: string,
): string | undefined {
  if (!result || result.ok !== false) return undefined;
  return result.fieldErrors?.[field];
}
