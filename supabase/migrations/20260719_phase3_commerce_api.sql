-- Phase 3: Commerce API — ApiKey + Order (+ OrderItem), order number sequence
-- Additive; POS Sale tables unchanged.

CREATE TYPE "OrderChannel" AS ENUM ('ONLINE', 'POS');
CREATE TYPE "OrderStatus" AS ENUM (
  'PENDING',
  'CONFIRMED',
  'PAID',
  'FULFILLING',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED'
);

ALTER TABLE "businesses"
  ADD COLUMN IF NOT EXISTS "next_order_number" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "api_keys" (
  "id" TEXT NOT NULL,
  "business_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "key_prefix" TEXT NOT NULL,
  "key_hash" TEXT NOT NULL,
  "scopes" JSONB NOT NULL DEFAULT '[]',
  "last_used_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "api_keys_key_hash_key" ON "api_keys"("key_hash");
CREATE INDEX IF NOT EXISTS "api_keys_business_id_idx" ON "api_keys"("business_id");

DO $$ BEGIN
  ALTER TABLE "api_keys"
    ADD CONSTRAINT "api_keys_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "orders" (
  "id" TEXT NOT NULL,
  "business_id" TEXT NOT NULL,
  "customer_id" TEXT,
  "channel" "OrderChannel" NOT NULL DEFAULT 'ONLINE',
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "order_number" TEXT NOT NULL,
  "idempotency_key" TEXT,
  "subtotal_cents" INTEGER NOT NULL,
  "discount_cents" INTEGER NOT NULL DEFAULT 0,
  "tax_cents" INTEGER NOT NULL DEFAULT 0,
  "total_cents" INTEGER NOT NULL,
  "currency_code" TEXT NOT NULL DEFAULT 'ZAR',
  "customer_email" TEXT,
  "customer_name" TEXT,
  "customer_phone" TEXT,
  "notes" TEXT,
  "metadata" JSONB,
  "confirmed_at" TIMESTAMP(3),
  "cancelled_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "orders_business_id_order_number_key"
  ON "orders"("business_id", "order_number");
CREATE UNIQUE INDEX IF NOT EXISTS "orders_business_id_idempotency_key_key"
  ON "orders"("business_id", "idempotency_key");
CREATE INDEX IF NOT EXISTS "orders_business_id_created_at_idx"
  ON "orders"("business_id", "created_at");
CREATE INDEX IF NOT EXISTS "orders_business_id_status_idx"
  ON "orders"("business_id", "status");

DO $$ BEGIN
  ALTER TABLE "orders"
    ADD CONSTRAINT "orders_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "orders"
    ADD CONSTRAINT "orders_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "order_items" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "product_name" TEXT NOT NULL,
  "quantity" DECIMAL(14,3) NOT NULL,
  "unit_price_cents" INTEGER NOT NULL,
  "discount_cents" INTEGER NOT NULL DEFAULT 0,
  "total_cents" INTEGER NOT NULL,
  CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "order_items_order_id_idx" ON "order_items"("order_id");

DO $$ BEGIN
  ALTER TABLE "order_items"
    ADD CONSTRAINT "order_items_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "order_items"
    ADD CONSTRAINT "order_items_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
