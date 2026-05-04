-- Full-safe SQL: add `primarySellerId` to "Order" and backfill with fallbacks
-- Usage: run in Supabase SQL editor or psql. This file is idempotent.

BEGIN;

-- 1) Add column if missing
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Order' AND column_name = 'primarySellerId'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "primarySellerId" TEXT;
    END IF;
END $$;

-- 2) Create index if missing
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'i' AND c.relname = 'Order_primarySellerId_idx'
    ) THEN
        CREATE INDEX "Order_primarySellerId_idx" ON "Order"("primarySellerId");
    END IF;
END $$;

-- 3) Backfill logic:
-- Preferential order:
--   a) If table "OrderItem" exists, use aggregated sellerId per order
--   b) Else if "Order" contains column productId, use Product.sellerId
--   c) Else if "Order" contains sellerId column, copy it

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'OrderItem') THEN
        -- Backfill from OrderItem (one seller per order: choose MIN(sellerId) as stable choice)
        UPDATE "Order" o
        SET "primarySellerId" = sub.sellerId
        FROM (
            SELECT "orderId", MIN("sellerId") AS sellerId
            FROM "OrderItem"
            GROUP BY "orderId"
        ) sub
        WHERE o.id = sub."orderId" AND (o."primarySellerId" IS NULL OR o."primarySellerId" = '');

    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'productId') THEN
        -- Legacy: Order has productId -> join with Product to get sellerId
        UPDATE "Order" o
        SET "primarySellerId" = p."sellerId"
        FROM "Product" p
        WHERE o."productId" = p.id AND (o."primarySellerId" IS NULL OR o."primarySellerId" = '');

    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'sellerId') THEN
        -- Legacy: Order already had sellerId column, copy into primarySellerId where empty
        UPDATE "Order"
        SET "primarySellerId" = "sellerId"
        WHERE ("primarySellerId" IS NULL OR "primarySellerId" = '') AND ("sellerId" IS NOT NULL AND "sellerId" <> '');
    END IF;
END $$;

COMMIT;

-- Optional verification queries (uncomment to run):
-- SELECT id, "primarySellerId" FROM "Order" ORDER BY "createdAt" DESC LIMIT 20;
-- SELECT COUNT(*) FROM "Order" WHERE "primarySellerId" IS NULL OR "primarySellerId" = '';
