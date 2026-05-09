-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "fullName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "cpf" TEXT,
    "cep" TEXT,
    "rua" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "referencia" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pago',
    "trackingCode" TEXT,
    "trackingUrl" TEXT,
    "recipient" TEXT,
    "hasBump" BOOLEAN NOT NULL DEFAULT false,
    "selectedBumps" JSONB,
    "paymentMethod" TEXT,
    "totalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mpPaymentId" TEXT,
    "installments" INTEGER,
    "installmentAmount" DOUBLE PRECISION,
    "cardBrand" TEXT,
    "netReceived" DOUBLE PRECISION,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "storeName" TEXT DEFAULT 'PagFlow',
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isDigital" BOOLEAN NOT NULL DEFAULT false,
    "accessLink" TEXT,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderBump" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" TEXT,

    CONSTRAINT "OrderBump_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customization_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(255) NOT NULL,
    "value" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customization_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_pixels" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "pixel_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_pixels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_pixels" (
    "product_id" UUID NOT NULL,
    "pixel_id" UUID NOT NULL,

    CONSTRAINT "product_pixels_pkey" PRIMARY KEY ("product_id","pixel_id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "pix_price" DECIMAL(10,2),
    "access_link" TEXT,
    "checkout_images" TEXT[],
    "order_bump_1_name" VARCHAR(255),
    "order_bump_1_description" TEXT,
    "order_bump_1_price" DECIMAL(10,2),
    "order_bump_2_name" VARCHAR(255),
    "order_bump_2_description" TEXT,
    "order_bump_2_price" DECIMAL(10,2),
    "order_bump_3_name" VARCHAR(255),
    "order_bump_3_description" TEXT,
    "order_bump_3_price" DECIMAL(10,2),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subscription_data" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID,
    "customer_name" VARCHAR(255) NOT NULL,
    "customer_email" VARCHAR(255) NOT NULL,
    "pushing_pay_id" VARCHAR(255),
    "status" VARCHAR(50) DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "customer_cep" VARCHAR(20),
    "customer_address" TEXT,
    "customer_number" VARCHAR(50),
    "customer_complement" VARCHAR(255),
    "customer_neighborhood" VARCHAR(255),
    "customer_city" VARCHAR(255),
    "customer_state" VARCHAR(50),
    "delivery_instructions" TEXT,
    "shipping_type" VARCHAR(100),
    "shipping_amount" DECIMAL(10,2) DEFAULT 0,
    "utm_source" VARCHAR(255),
    "utm_medium" VARCHAR(255),
    "utm_campaign" VARCHAR(255),
    "utm_term" VARCHAR(255),
    "utm_content" VARCHAR(255),
    "utm_placement" VARCHAR(255),
    "utm_id" VARCHAR(255),
    "utm_creative_name" VARCHAR(255),
    "payment_detail" TEXT,
    "accepted_bumps" JSONB,
    "payment_method" VARCHAR(50),

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "delivery_time" VARCHAR(100),
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipping_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customization_settings_key_key" ON "customization_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "idx_sales_created_at" ON "sales"("created_at");

-- CreateIndex
CREATE INDEX "idx_sales_product_id" ON "sales"("product_id");

-- CreateIndex
CREATE INDEX "idx_sales_status" ON "sales"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_slug_key" ON "EmailTemplate"("slug");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderBump" ADD CONSTRAINT "OrderBump_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_pixels" ADD CONSTRAINT "product_pixels_pixel_id_fkey" FOREIGN KEY ("pixel_id") REFERENCES "marketing_pixels"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_pixels" ADD CONSTRAINT "product_pixels_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
