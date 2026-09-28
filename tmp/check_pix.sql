SELECT
  payment_method,
  payment_status,
  COUNT(*) as total
FROM "Order"
WHERE payment_method IN ('pix', 'credito')
GROUP BY payment_method, payment_status
ORDER BY payment_method, payment_status;

SELECT
  'PIX_7d' as period,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE "paymentStatus" = 'pago') as paid,
  ROUND(COUNT(*) FILTER (WHERE "paymentStatus" = 'pago') * 100.0 / NULLIF(COUNT(*), 0), 1) as conv_rate
FROM "Order"
WHERE "paymentMethod" = 'pix' AND "createdAt" > NOW() - INTERVAL '7 days'
UNION ALL
SELECT
  'PIX_30d',
  COUNT(*),
  COUNT(*) FILTER (WHERE "paymentStatus" = 'pago'),
  ROUND(COUNT(*) FILTER (WHERE "paymentStatus" = 'pago') * 100.0 / NULLIF(COUNT(*), 0), 1)
FROM "Order"
WHERE "paymentMethod" = 'pix' AND "createdAt" > NOW() - INTERVAL '30 days'
UNION ALL
SELECT
  'CRED_7d',
  COUNT(*),
  COUNT(*) FILTER (WHERE "paymentStatus" = 'pago'),
  ROUND(COUNT(*) FILTER (WHERE "paymentStatus" = 'pago') * 100.0 / NULLIF(COUNT(*), 0), 1)
FROM "Order"
WHERE "paymentMethod" = 'credito' AND "createdAt" > NOW() - INTERVAL '7 days'
UNION ALL
SELECT
  'CRED_30d',
  COUNT(*),
  COUNT(*) FILTER (WHERE "paymentStatus" = 'pago'),
  ROUND(COUNT(*) FILTER (WHERE "paymentStatus" = 'pago') * 100.0 / NULLIF(COUNT(*), 0), 1)
FROM "Order"
WHERE "paymentMethod" = 'credito' AND "createdAt" > NOW() - INTERVAL '30 days';
