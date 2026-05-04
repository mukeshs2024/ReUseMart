-- Safe ALTER script: add `primarySellerId` to Order and backfill
-- Run this in your Supabase SQL editor or psql client

BEGIN;

-- Add column if missing
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Order' AND column_name = 'primarySellerId'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "primarySellerId" TEXT;
    END IF;
END $$;

-- Create index for faster lookups (if not exists)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'i' AND c.relname = 'Order_primarySellerId_idx'
    ) THEN
        CREATE INDEX "Order_primarySellerId_idx" ON "Order"("primarySellerId");
    END IF;
END $$;

-- Backfill primarySellerId from OrderItem (choose the smallest sellerId per order)
-- This uses an aggregated subquery to pick one seller per order when available.
UPDATE "Order" o
SET "primarySellerId" = sub.sellerId
FROM (
    SELECT "orderId", MIN("sellerId") AS sellerId
    FROM "OrderItem"
    GROUP BY "orderId"
) sub
WHERE o.id = sub."orderId" AND (o."primarySellerId" IS NULL OR o."primarySellerId" = '');

COMMIT;

-- Verification queries (optional)
-- SELECT id, "primarySellerId" FROM "Order" LIMIT 20;
-- SELECT * FROM "Order" WHERE "primarySellerId" IS NULL LIMIT 20;
