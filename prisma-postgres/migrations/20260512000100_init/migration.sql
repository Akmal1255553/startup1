CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "refreshToken" TEXT,
    "refreshTokenExpires" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReturnDecision" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "returnId" TEXT,
    "orderName" TEXT,
    "decision" TEXT NOT NULL,
    "risk" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReturnDecision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReturnDecisionEvent" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "returnId" TEXT,
    "orderName" TEXT,
    "previousDecision" TEXT,
    "decision" TEXT NOT NULL,
    "risk" INTEGER,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReturnDecisionEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Playbook" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "action" TEXT NOT NULL,
    "minOrderValue" INTEGER,
    "suspiciousDomainsCsv" TEXT,
    "repeatReturnsThreshold" INTEGER,
    "minAccountAgeDays" INTEGER,
    "vipBypassEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Playbook_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReturnRiskSetting" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "mediumValueThreshold" INTEGER NOT NULL DEFAULT 100,
    "highValueThreshold" INTEGER NOT NULL DEFAULT 250,
    "reviewRiskThreshold" INTEGER NOT NULL DEFAULT 60,
    "holdRiskThreshold" INTEGER NOT NULL DEFAULT 80,
    "newCustomerRiskDelta" INTEGER NOT NULL DEFAULT 16,
    "repeatCustomerRiskDelta" INTEGER NOT NULL DEFAULT 12,
    "unfulfilledRiskDelta" INTEGER NOT NULL DEFAULT 12,
    "paymentReviewRiskDelta" INTEGER NOT NULL DEFAULT 14,
    "protectedMarginMultiplier" DECIMAL(65,30) NOT NULL DEFAULT 0.25,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReturnRiskSetting_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReturnDecision_shop_orderId_returnId_idx" ON "ReturnDecision"("shop", "orderId", "returnId");
CREATE INDEX "ReturnDecision_shop_returnId_idx" ON "ReturnDecision"("shop", "returnId");
CREATE INDEX "ReturnDecision_shop_idx" ON "ReturnDecision"("shop");

CREATE INDEX "ReturnDecisionEvent_shop_createdAt_idx" ON "ReturnDecisionEvent"("shop", "createdAt");
CREATE INDEX "ReturnDecisionEvent_shop_orderId_idx" ON "ReturnDecisionEvent"("shop", "orderId");
CREATE INDEX "ReturnDecisionEvent_shop_returnId_idx" ON "ReturnDecisionEvent"("shop", "returnId");

CREATE INDEX "Playbook_shop_isActive_idx" ON "Playbook"("shop", "isActive");
CREATE INDEX "Playbook_shop_createdAt_idx" ON "Playbook"("shop", "createdAt");

CREATE UNIQUE INDEX "ReturnRiskSetting_shop_key" ON "ReturnRiskSetting"("shop");
