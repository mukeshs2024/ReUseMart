DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "SellerLevel" AS ENUM ('BASIC', 'VERIFIED', 'TRUSTED', 'PRO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "ActiveMode" AS ENUM ('BUYER', 'SELLER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "UserType" AS ENUM ('BUYER', 'SELLER', 'BOTH');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "ProductCategory" AS ENUM ('ELECTRONICS', 'MOBILES', 'FURNITURE', 'FASHION', 'ACCESSORIES');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "ProductCondition" AS ENUM ('LIKE_NEW', 'USED', 'OLD', 'TOO_OLD');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "MessageSender" AS ENUM ('BUYER', 'SELLER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "userType" "UserType" NOT NULL DEFAULT 'BUYER',
    "isSeller" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "trustScore" INTEGER NOT NULL DEFAULT 0,
    "sellerLevel" "SellerLevel" NOT NULL DEFAULT 'BASIC',
    "activeMode" "ActiveMode" NOT NULL DEFAULT 'BUYER',
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 1,
    "usageYears" INTEGER NOT NULL DEFAULT 0,
    "category" "ProductCategory" NOT NULL DEFAULT 'ELECTRONICS',
    "condition" "ProductCondition" NOT NULL DEFAULT 'USED',
    "imageUrl" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "paymentQrCode" TEXT,
    "paymentQrText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Product_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE,
    CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "Order_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Offer" (
    "id" TEXT PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "message" TEXT,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Offer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE,
    CONSTRAINT "Offer_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "Offer_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT PRIMARY KEY,
    "content" TEXT NOT NULL,
    "senderType" "MessageSender" NOT NULL DEFAULT 'BUYER',
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "Message_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "Message_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Rating" (
    "id" TEXT PRIMARY KEY,
    "productId" TEXT,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Rating_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "Rating_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE,
    CONSTRAINT "Rating_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Product_sellerId_idx" ON "Product"("sellerId");
CREATE INDEX IF NOT EXISTS "Order_productId_idx" ON "Order"("productId");
CREATE INDEX IF NOT EXISTS "Order_buyerId_idx" ON "Order"("buyerId");
CREATE INDEX IF NOT EXISTS "Order_sellerId_idx" ON "Order"("sellerId");
CREATE INDEX IF NOT EXISTS "Offer_productId_idx" ON "Offer"("productId");
CREATE INDEX IF NOT EXISTS "Offer_buyerId_idx" ON "Offer"("buyerId");
CREATE INDEX IF NOT EXISTS "Offer_sellerId_idx" ON "Offer"("sellerId");
CREATE INDEX IF NOT EXISTS "Message_buyerId_idx" ON "Message"("buyerId");
CREATE INDEX IF NOT EXISTS "Message_sellerId_idx" ON "Message"("sellerId");
CREATE INDEX IF NOT EXISTS "Message_productId_idx" ON "Message"("productId");
CREATE INDEX IF NOT EXISTS "Rating_buyerId_idx" ON "Rating"("buyerId");
CREATE INDEX IF NOT EXISTS "Rating_productId_idx" ON "Rating"("productId");
CREATE INDEX IF NOT EXISTS "Rating_sellerId_idx" ON "Rating"("sellerId");

UPDATE "Product"
SET "stock" = 1
WHERE "stock" IS NULL OR "stock" <= 0;

DELETE FROM "Order"
WHERE "productId" NOT IN (SELECT id FROM "Product")
   OR "buyerId" NOT IN (SELECT id FROM "User")
   OR "sellerId" NOT IN (SELECT id FROM "User");

DELETE FROM "Offer"
WHERE "productId" NOT IN (SELECT id FROM "Product")
   OR "buyerId" NOT IN (SELECT id FROM "User")
   OR "sellerId" NOT IN (SELECT id FROM "User");

DELETE FROM "Message"
WHERE "buyerId" NOT IN (SELECT id FROM "User")
   OR "sellerId" NOT IN (SELECT id FROM "User")
   OR "productId" NOT IN (SELECT id FROM "Product");

DELETE FROM "Rating"
WHERE "buyerId" NOT IN (SELECT id FROM "User")
   OR ("productId" IS NOT NULL AND "productId" NOT IN (SELECT id FROM "Product"))
   OR ("sellerId" IS NOT NULL AND "sellerId" NOT IN (SELECT id FROM "User"));

SELECT 'User' AS table_name, COUNT(*) AS record_count FROM "User"
UNION ALL
SELECT 'Product', COUNT(*) FROM "Product"
UNION ALL
SELECT 'Order', COUNT(*) FROM "Order"
UNION ALL
SELECT 'Offer', COUNT(*) FROM "Offer"
UNION ALL
SELECT 'Message', COUNT(*) FROM "Message"
UNION ALL
SELECT 'Rating', COUNT(*) FROM "Rating"
ORDER BY table_name;

SELECT id, name, email, "isSeller", "userType", "trustScore", "createdAt"
FROM "User"
ORDER BY "createdAt" DESC
LIMIT 10;

SELECT id, title, price, stock, category, condition, "sellerId", "createdAt"
FROM "Product"
ORDER BY "createdAt" DESC
LIMIT 10;

SELECT o.id, o.amount, o.quantity, o.status, p.title, b.name AS buyer, s.name AS seller
FROM "Order" o
LEFT JOIN "Product" p ON o."productId" = p.id
LEFT JOIN "User" b ON o."buyerId" = b.id
LEFT JOIN "User" s ON o."sellerId" = s.id
ORDER BY o."createdAt" DESC
LIMIT 10;

SELECT o.id, o.price, o.status, p.title, b.name AS buyer, s.name AS seller
FROM "Offer" o
LEFT JOIN "Product" p ON o."productId" = p.id
LEFT JOIN "User" b ON o."buyerId" = b.id
LEFT JOIN "User" s ON o."sellerId" = s.id
ORDER BY o."createdAt" DESC
LIMIT 10;

SELECT m.id, m.content, m."senderType", b.name AS buyer, s.name AS seller, p.title
FROM "Message" m
LEFT JOIN "User" b ON m."buyerId" = b.id
LEFT JOIN "User" s ON m."sellerId" = s.id
LEFT JOIN "Product" p ON m."productId" = p.id
ORDER BY m."createdAt" DESC
LIMIT 10;

SELECT r.id, r.rating, r.comment, b.name AS buyer, s.name AS seller
FROM "Rating" r
LEFT JOIN "User" b ON r."buyerId" = b.id
LEFT JOIN "User" s ON r."sellerId" = s.id
ORDER BY r."createdAt" DESC
LIMIT 10;