-- Real-user Web Vitals (LCP, INP, CLS, FCP, TTFB) captured from the checkout page.
CREATE TABLE IF NOT EXISTS "WebVital" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "rating" TEXT NOT NULL,
    "path" TEXT,
    "visitorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "WebVital_name_idx" ON "WebVital" ("name");
CREATE INDEX IF NOT EXISTS "WebVital_createdAt_idx" ON "WebVital" ("createdAt");
