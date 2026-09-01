-- Adds click/visitor tracking to Order and a new CheckoutEvent table for the checkout funnel.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "clickId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "visitorId" TEXT;
CREATE INDEX IF NOT EXISTS "Order_clickId_idx" ON "Order" ("clickId");
CREATE INDEX IF NOT EXISTS "Order_visitorId_idx" ON "Order" ("visitorId");

CREATE TABLE IF NOT EXISTS "CheckoutEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visitorId" TEXT NOT NULL,
    "productId" TEXT,
    "step" TEXT NOT NULL,
    "orderId" TEXT,
    "clickId" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmTerm" TEXT,
    "utmContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "CheckoutEvent_visitorId_idx" ON "CheckoutEvent" ("visitorId");
CREATE INDEX IF NOT EXISTS "CheckoutEvent_step_idx" ON "CheckoutEvent" ("step");
CREATE INDEX IF NOT EXISTS "CheckoutEvent_createdAt_idx" ON "CheckoutEvent" ("createdAt");
CREATE INDEX IF NOT EXISTS "CheckoutEvent_clickId_idx" ON "CheckoutEvent" ("clickId");
