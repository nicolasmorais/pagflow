-- AddColumn: couponCode on Order (cupom de saída aplicado no pedido)
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "couponCode" TEXT;
