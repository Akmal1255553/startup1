/**
 * Onboarding state lives in its own table because we need it before any
 * other data exists for a shop. Each step is a nullable timestamp; null
 * means "not done yet". Once `completedAt` is set, the dashboard stops
 * suggesting onboarding.
 *
 * Steps (must match what the UI renders, in order):
 *   1. welcome           — saw the intro screen
 *   2. scopes            — confirmed access scopes look right
 *   3. playbook          — seeded a starter playbook (or skipped)
 *   4. settings          — reviewed risk thresholds (or skipped)
 *
 * The `dismissedAt` column lets a merchant hide the onboarding banner
 * without finishing it (e.g., after reinstall).
 */
import prisma from "../db.server";

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

export async function getOnboardingProgress(
  shop: string,
): Promise<OnboardingProgress> {
  const row = await prisma.onboardingState.findUnique({ where: { shop } });

  const welcomeAcknowledged = Boolean(row?.welcomeAcknowledgedAt);
  const scopesVerified = Boolean(row?.scopesVerifiedAt);
  const playbookSeeded = Boolean(row?.playbookSeededAt);
  const settingsTuned = Boolean(row?.settingsTunedAt);
  const completed = Boolean(row?.completedAt);
  const dismissed = Boolean(row?.dismissedAt);

  const doneCount =
    Number(welcomeAcknowledged) +
    Number(scopesVerified) +
    Number(playbookSeeded) +
    Number(settingsTuned);

  let nextStep: OnboardingStep | null = null;
  if (!welcomeAcknowledged) nextStep = "welcome";
  else if (!scopesVerified) nextStep = "scopes";
  else if (!playbookSeeded) nextStep = "playbook";
  else if (!settingsTuned) nextStep = "settings";

  return {
    shop,
    welcomeAcknowledged,
    scopesVerified,
    playbookSeeded,
    settingsTuned,
    completed,
    dismissed,
    nextStep,
    percent: Math.round((doneCount / ONBOARDING_STEPS.length) * 100),
  };
}

const STEP_COLUMN: Record<OnboardingStep, string> = {
  welcome: "welcomeAcknowledgedAt",
  scopes: "scopesVerifiedAt",
  playbook: "playbookSeededAt",
  settings: "settingsTunedAt",
};

export async function markStepComplete(
  shop: string,
  step: OnboardingStep,
): Promise<void> {
  const column = STEP_COLUMN[step];
  const now = new Date();
  await prisma.onboardingState.upsert({
    where: { shop },
    update: { [column]: now },
    create: { shop, [column]: now },
  });

  // Auto-complete onboarding once every step has a timestamp.
  const progress = await getOnboardingProgress(shop);
  if (
    progress.welcomeAcknowledged &&
    progress.scopesVerified &&
    progress.playbookSeeded &&
    progress.settingsTuned &&
    !progress.completed
  ) {
    await prisma.onboardingState.update({
      where: { shop },
      data: { completedAt: now },
    });
  }
}

export async function dismissOnboarding(shop: string): Promise<void> {
  const now = new Date();
  await prisma.onboardingState.upsert({
    where: { shop },
    update: { dismissedAt: now },
    create: { shop, dismissedAt: now },
  });
}

export async function resetOnboarding(shop: string): Promise<void> {
  await prisma.onboardingState.upsert({
    where: { shop },
    update: {
      welcomeAcknowledgedAt: null,
      scopesVerifiedAt: null,
      playbookSeededAt: null,
      settingsTunedAt: null,
      completedAt: null,
      dismissedAt: null,
    },
    create: { shop },
  });
}

/**
 * Seed a single "Auto-approve trusted repeat buyers" playbook so the
 * merchant has something to look at in /app/playbooks straight away.
 * No-op if the shop already has at least one playbook (e.g. reinstall).
 */
export async function seedStarterPlaybook(shop: string): Promise<void> {
  const existing = await prisma.playbook.count({ where: { shop } });
  if (existing > 0) {
    await markStepComplete(shop, "playbook");
    return;
  }

  await prisma.playbook.create({
    data: {
      shop,
      name: "Auto-approve trusted repeat buyers",
      notes:
        "Starter rule: customers with 5+ orders and account age 90+ days get auto-approved on returns.",
      isActive: true,
      action: "approved",
      repeatReturnsThreshold: 5,
      minAccountAgeDays: 90,
    },
  });
  await markStepComplete(shop, "playbook");
}
