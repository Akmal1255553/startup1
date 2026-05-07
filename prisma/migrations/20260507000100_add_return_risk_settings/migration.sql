-- CreateTable
CREATE TABLE "ReturnRiskSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "mediumValueThreshold" INTEGER NOT NULL DEFAULT 100,
    "highValueThreshold" INTEGER NOT NULL DEFAULT 250,
    "reviewRiskThreshold" INTEGER NOT NULL DEFAULT 60,
    "holdRiskThreshold" INTEGER NOT NULL DEFAULT 80,
    "newCustomerRiskDelta" INTEGER NOT NULL DEFAULT 16,
    "repeatCustomerRiskDelta" INTEGER NOT NULL DEFAULT 12,
    "unfulfilledRiskDelta" INTEGER NOT NULL DEFAULT 12,
    "paymentReviewRiskDelta" INTEGER NOT NULL DEFAULT 14,
    "protectedMarginMultiplier" DECIMAL NOT NULL DEFAULT 0.25,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ReturnRiskSetting_shop_key" ON "ReturnRiskSetting"("shop");
