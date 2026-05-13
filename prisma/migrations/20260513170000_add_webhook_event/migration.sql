CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "shopifyId" TEXT,
    "payloadJson" TEXT NOT NULL,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "WebhookEvent_shop_topic_receivedAt_idx"
  ON "WebhookEvent" ("shop", "topic", "receivedAt");

CREATE INDEX "WebhookEvent_shop_shopifyId_idx"
  ON "WebhookEvent" ("shop", "shopifyId");
