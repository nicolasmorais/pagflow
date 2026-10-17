-- AddColumn: quantity on Product (default 1)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "quantity" INTEGER NOT NULL DEFAULT 1;
