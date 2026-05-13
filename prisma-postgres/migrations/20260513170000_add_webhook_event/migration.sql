CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "shopifyId" TEXT,
    "payloadJson" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WebhookEvent_shop_topic_receivedAt_idx"
  ON "WebhookEvent"("shop", "topic", "receivedAt");

CREATE INDEX "WebhookEvent_shop_shopifyId_idx"
  ON "WebhookEvent"("shop", "shopifyId");
