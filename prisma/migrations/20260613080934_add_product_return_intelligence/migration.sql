-- CreateTable
CREATE TABLE "ProductReturnMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "sku" TEXT,
    "ordersCount" INTEGER NOT NULL DEFAULT 0,
    "returnsCount" INTEGER NOT NULL DEFAULT 0,
    "returnRate" DECIMAL NOT NULL DEFAULT 0,
    "revenueLost" DECIMAL NOT NULL DEFAULT 0,
    "revenueAtRisk" DECIMAL NOT NULL DEFAULT 0,
    "revenueRecoverable" DECIMAL NOT NULL DEFAULT 0,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "reasonSizing" INTEGER NOT NULL DEFAULT 0,
    "reasonDamaged" INTEGER NOT NULL DEFAULT 0,
    "reasonNotAsDescribed" INTEGER NOT NULL DEFAULT 0,
    "reasonChangedMind" INTEGER NOT NULL DEFAULT 0,
    "reasonLateDelivery" INTEGER NOT NULL DEFAULT 0,
    "reasonOther" INTEGER NOT NULL DEFAULT 0,
    "customerComplaints" INTEGER NOT NULL DEFAULT 0,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "lastSyncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductReturnTrendDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProductReturnTrendDay_shop_productId_fkey" FOREIGN KEY ("shop", "productId") REFERENCES "ProductReturnMetric" ("shop", "productId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductReturnEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "returnId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "reasonCategory" TEXT NOT NULL,
    "unitPrice" DECIMAL NOT NULL DEFAULT 0,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "returnedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "ProductReturnMetric_shop_returnRate_idx" ON "ProductReturnMetric"("shop", "returnRate");

-- CreateIndex
CREATE INDEX "ProductReturnMetric_shop_riskScore_idx" ON "ProductReturnMetric"("shop", "riskScore");

-- CreateIndex
CREATE INDEX "ProductReturnMetric_shop_returnsCount_idx" ON "ProductReturnMetric"("shop", "returnsCount");

-- CreateIndex
CREATE UNIQUE INDEX "ProductReturnMetric_shop_productId_key" ON "ProductReturnMetric"("shop", "productId");

-- CreateIndex
CREATE INDEX "ProductReturnTrendDay_shop_productId_idx" ON "ProductReturnTrendDay"("shop", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductReturnTrendDay_shop_productId_date_key" ON "ProductReturnTrendDay"("shop", "productId", "date");

-- CreateIndex
CREATE INDEX "ProductReturnEvent_shop_productId_returnedAt_idx" ON "ProductReturnEvent"("shop", "productId", "returnedAt");

-- CreateIndex
CREATE INDEX "ProductReturnEvent_shop_returnId_idx" ON "ProductReturnEvent"("shop", "returnId");
