CREATE TABLE "OnboardingState" (
    "shop" TEXT NOT NULL PRIMARY KEY,
    "welcomeAcknowledgedAt" DATETIME,
    "scopesVerifiedAt" DATETIME,
    "playbookSeededAt" DATETIME,
    "settingsTunedAt" DATETIME,
    "completedAt" DATETIME,
    "dismissedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
