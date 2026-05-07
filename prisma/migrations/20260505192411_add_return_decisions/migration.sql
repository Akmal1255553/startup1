-- CreateTable
CREATE TABLE "ReturnDecision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderName" TEXT,
    "decision" TEXT NOT NULL,
    "risk" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "ReturnDecision_shop_idx" ON "ReturnDecision"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnDecision_shop_orderId_key" ON "ReturnDecision"("shop", "orderId");
