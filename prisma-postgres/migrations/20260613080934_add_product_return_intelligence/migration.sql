-- CreateTable
CREATE TABLE "ProductReturnMetric" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "sku" TEXT,
    "ordersCount" INTEGER NOT NULL DEFAULT 0,
    "returnsCount" INTEGER NOT NULL DEFAULT 0,
    "returnRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "revenueLost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "revenueAtRisk" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "revenueRecoverable" DECIMAL(65,30) NOT NULL DEFAULT 0,
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
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductReturnMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductReturnTrendDay" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductReturnTrendDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductReturnEvent" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "returnId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "reasonCategory" TEXT NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "returnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductReturnEvent_pkey" PRIMARY KEY ("id")
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

-- AddForeignKey
ALTER TABLE "ProductReturnTrendDay" ADD CONSTRAINT "ProductReturnTrendDay_shop_productId_fkey" FOREIGN KEY ("shop", "productId") REFERENCES "ProductReturnMetric"("shop", "productId") ON DELETE CASCADE ON UPDATE CASCADE;
