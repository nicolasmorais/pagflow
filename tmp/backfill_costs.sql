-- Backfill productCost from Product.cost for August orders
UPDATE "Order" o
SET "productCost" = p.cost
FROM "Product" p
WHERE o."productId" = p.id
  AND o."createdAt" >= '2025-08-01'
  AND (o."productCost" = 0 OR o."productCost" IS NULL)
  AND p.cost > 0;

-- Verify result
SELECT
  COUNT(*) as total_agosto,
  COUNT(*) FILTER (WHERE "productCost" = 0 OR "productCost" IS NULL) as sem_custo,
  COUNT(*) FILTER (WHERE "productCost" > 0) as com_custo
FROM "Order"
WHERE "createdAt" >= '2025-08-01';
