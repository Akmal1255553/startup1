CREATE TABLE "OnboardingState" (
    "shop" TEXT NOT NULL,
    "welcomeAcknowledgedAt" TIMESTAMP(3),
    "scopesVerifiedAt" TIMESTAMP(3),
    "playbookSeededAt" TIMESTAMP(3),
    "settingsTunedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingState_pkey" PRIMARY KEY ("shop")
);
