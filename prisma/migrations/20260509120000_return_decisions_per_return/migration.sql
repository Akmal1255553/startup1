-- Redefine ReturnDecision uniqueness: allow one row per shop+order only for
-- dashboard (returnId IS NULL), plus one row per shop+return when returnId is set.

PRAGMA foreign_keys=OFF;

CREATE TABLE "new_ReturnDecision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "returnId" TEXT,
    "orderName" TEXT,
    "decision" TEXT NOT NULL,
    "risk" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_ReturnDecision"
  ("id", "shop", "orderId", "returnId", "orderName", "decision", "risk", "createdAt", "updatedAt")
SELECT
  "id",
  "shop",
  "orderId",
  NULL,
  "orderName",
  "decision",
  "risk",
  "createdAt",
  "updatedAt"
FROM "ReturnDecision";

DROP TABLE "ReturnDecision";
ALTER TABLE "new_ReturnDecision" RENAME TO "ReturnDecision";

CREATE INDEX "ReturnDecision_shop_orderId_returnId_idx"
  ON "ReturnDecision" ("shop", "orderId", "returnId");

CREATE INDEX "ReturnDecision_shop_returnId_idx"
  ON "ReturnDecision" ("shop", "returnId");

CREATE INDEX "ReturnDecision_shop_idx" ON "ReturnDecision" ("shop");

CREATE TABLE "new_ReturnDecisionEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "returnId" TEXT,
    "orderName" TEXT,
    "previousDecision" TEXT,
    "decision" TEXT NOT NULL,
    "risk" INTEGER,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "new_ReturnDecisionEvent"
  ("id", "shop", "orderId", "returnId", "orderName", "previousDecision", "decision", "risk", "reason", "createdAt")
SELECT
  "id",
  "shop",
  "orderId",
  NULL,
  "orderName",
  "previousDecision",
  "decision",
  "risk",
  "reason",
  "createdAt"
FROM "ReturnDecisionEvent";

DROP TABLE "ReturnDecisionEvent";
ALTER TABLE "new_ReturnDecisionEvent" RENAME TO "ReturnDecisionEvent";

CREATE INDEX "ReturnDecisionEvent_shop_createdAt_idx"
  ON "ReturnDecisionEvent" ("shop", "createdAt");

CREATE INDEX "ReturnDecisionEvent_shop_orderId_idx"
  ON "ReturnDecisionEvent" ("shop", "orderId");

CREATE INDEX "ReturnDecisionEvent_shop_returnId_idx"
  ON "ReturnDecisionEvent" ("shop", "returnId");

PRAGMA foreign_keys=ON;
