-- August orders missing productCost
SELECT
  COUNT(*) as total_agosto,
  COUNT(*) FILTER (WHERE "productCost" = 0 OR "productCost" IS NULL) as sem_custo,
  COUNT(*) FILTER (WHERE "productCost" > 0) as com_custo
FROM "Order"
WHERE "createdAt" >= '2025-08-01';

-- Products with cost set
SELECT id, name, cost FROM "Product" WHERE cost > 0;

-- Recent August orders without cost
SELECT id, "fullName", "totalPrice", "productCost", "productId", "createdAt"
FROM "Order"
WHERE "createdAt" >= '2025-08-01'
  AND ("productCost" = 0 OR "productCost" IS NULL)
ORDER BY "createdAt" DESC
LIMIT 10;
