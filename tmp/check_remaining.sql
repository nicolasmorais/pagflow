-- Check remaining orders without cost: what products do they reference?
SELECT
  o."productId",
  p.name as product_name,
  p.cost as product_cost,
  COUNT(*) as orders
FROM "Order" o
LEFT JOIN "Product" p ON o."productId" = p.id
WHERE o."createdAt" >= '2025-08-01'
  AND (o."productCost" = 0 OR o."productCost" IS NULL)
GROUP BY o."productId", p.name, p.cost
ORDER BY orders DESC;
