/**
 * Client-safe pieces of the onboarding flow. Anything that needs to be
 * rendered in a React component or referenced from non-loader/action code
 * must live here — Remix Vite forbids importing values from `*.server.ts`
 * files into client bundles and fails the build with a `PLUGIN_ERROR` if
 * we try.
 */

export type OnboardingStep =
  | "welcome"
  | "scopes"
  | "playbook"
  | "settings";

export const ONBOARDING_STEPS: OnboardingStep[] = [
  "welcome",
  "scopes",
  "playbook",
  "settings",
];

export type OnboardingProgress = {
  shop: string;
  welcomeAcknowledged: boolean;
  scopesVerified: boolean;
  playbookSeeded: boolean;
  settingsTuned: boolean;
  completed: boolean;
  dismissed: boolean;
  /** First step that hasn't been completed yet, or null if all done. */
  nextStep: OnboardingStep | null;
  /** 0–100. Used by the progress bar on the dashboard banner. */
  percent: number;
};
