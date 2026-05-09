-- CreateTable
CREATE TABLE "ReturnDecisionEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderName" TEXT,
    "previousDecision" TEXT,
    "decision" TEXT NOT NULL,
    "risk" INTEGER,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Playbook" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "ReturnDecisionEvent_shop_createdAt_idx" ON "ReturnDecisionEvent"("shop", "createdAt");

-- CreateIndex
CREATE INDEX "ReturnDecisionEvent_shop_orderId_idx" ON "ReturnDecisionEvent"("shop", "orderId");

-- CreateIndex
CREATE INDEX "Playbook_shop_isActive_idx" ON "Playbook"("shop", "isActive");

-- CreateIndex
CREATE INDEX "Playbook_shop_createdAt_idx" ON "Playbook"("shop", "createdAt");
