-- ============================================
-- REUSEMART DATABASE - COMPLETE SQL SCHEMA
-- ============================================
-- This file contains ALL required tables and their complete structure
-- If any table is missing, run these CREATE statements

-- ============================================
-- ENUMS (PostgreSQL)
-- ============================================

CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "SellerLevel" AS ENUM ('BASIC', 'VERIFIED', 'TRUSTED', 'PRO');
CREATE TYPE "ActiveMode" AS ENUM ('BUYER', 'SELLER');
CREATE TYPE "UserType" AS ENUM ('BUYER', 'SELLER', 'BOTH');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ProductCategory" AS ENUM ('ELECTRONICS', 'MOBILES', 'FURNITURE', 'FASHION', 'ACCESSORIES');
CREATE TYPE "ProductCondition" AS ENUM ('LIKE_NEW', 'USED', 'OLD', 'TOO_OLD');
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');
CREATE TYPE "MessageSender" AS ENUM ('BUYER', 'SELLER');

-- ============================================
-- TABLE 1: User
-- ============================================
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

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- ============================================
-- TABLE 2: Product
-- ============================================
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

CREATE INDEX IF NOT EXISTS "Product_sellerId_idx" ON "Product"("sellerId");

-- ============================================
-- TABLE 3: Order
-- ============================================
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

CREATE INDEX IF NOT EXISTS "Order_productId_idx" ON "Order"("productId");
CREATE INDEX IF NOT EXISTS "Order_buyerId_idx" ON "Order"("buyerId");
CREATE INDEX IF NOT EXISTS "Order_sellerId_idx" ON "Order"("sellerId");

-- ============================================
-- TABLE 4: Offer
-- ============================================
CREATE TABLE IF NOT EXISTS "Offer" (
    "id" TEXT PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "message" TEXT,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Offer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE,
    CONSTRAINT "Offer_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "Offer_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Offer_productId_idx" ON "Offer"("productId");
CREATE INDEX IF NOT EXISTS "Offer_buyerId_idx" ON "Offer"("buyerId");
CREATE INDEX IF NOT EXISTS "Offer_sellerId_idx" ON "Offer"("sellerId");

-- ============================================
-- TABLE 5: Message
-- ============================================
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

CREATE INDEX IF NOT EXISTS "Message_buyerId_idx" ON "Message"("buyerId");
CREATE INDEX IF NOT EXISTS "Message_sellerId_idx" ON "Message"("sellerId");
CREATE INDEX IF NOT EXISTS "Message_productId_idx" ON "Message"("productId");

-- ============================================
-- TABLE 6: Rating
-- ============================================
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

CREATE INDEX IF NOT EXISTS "Rating_buyerId_idx" ON "Rating"("buyerId");
CREATE INDEX IF NOT EXISTS "Rating_productId_idx" ON "Rating"("productId");
CREATE INDEX IF NOT EXISTS "Rating_sellerId_idx" ON "Rating"("sellerId");

-- ============================================
-- VERIFICATION QUERIES - Run these to check data
-- ============================================

-- Check if all tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Count records in each table
SELECT 'User' as table_name, COUNT(*) as record_count FROM "User"
UNION ALL
SELECT 'Product', COUNT(*) FROM "Product"
UNION ALL
SELECT 'Order', COUNT(*) FROM "Order"
UNION ALL
SELECT 'Offer', COUNT(*) FROM "Offer"
UNION ALL
SELECT 'Message', COUNT(*) FROM "Message"
UNION ALL
SELECT 'Rating', COUNT(*) FROM "Rating";

-- Check User records with seller status
SELECT id, name, email, isSeller, userType, trustScore, createdAt FROM "User" LIMIT 10;

-- Check Product records
SELECT id, title, price, stock, category, condition, sellerId, createdAt FROM "Product" LIMIT 10;

-- Check Order records with full details
SELECT o.id, o.amount, o.quantity, o.status, p.title, u.name as buyer, s.name as seller 
FROM "Order" o 
LEFT JOIN "Product" p ON o."productId" = p.id 
LEFT JOIN "User" u ON o."buyerId" = u.id 
LEFT JOIN "User" s ON o."sellerId" = s.id 
LIMIT 10;

-- Check Offer records
SELECT o.id, o.price, o.status, p.title, b.name as buyer, s.name as seller 
FROM "Offer" o 
LEFT JOIN "Product" p ON o."productId" = p.id 
LEFT JOIN "User" b ON o."buyerId" = b.id 
LEFT JOIN "User" s ON o."sellerId" = s.id 
LIMIT 10;

-- Check Message records
SELECT m.id, m.content, m."senderType", b.name as buyer, s.name as seller, p.title 
FROM "Message" m 
LEFT JOIN "User" b ON m."buyerId" = b.id 
LEFT JOIN "User" s ON m."sellerId" = s.id 
LEFT JOIN "Product" p ON m."productId" = p.id 
LIMIT 10;

-- Check Rating records
SELECT r.id, r.rating, r.comment, b.name as buyer, s.name as seller 
FROM "Rating" r 
LEFT JOIN "User" b ON r."buyerId" = b.id 
LEFT JOIN "User" s ON r."sellerId" = s.id 
LIMIT 10;

-- ============================================
-- CHECK DATA INTEGRITY - Run these to find issues
-- ============================================

-- Find Products with missing sellers
SELECT p.id, p.title, p."sellerId" FROM "Product" p 
WHERE p."sellerId" NOT IN (SELECT id FROM "User");

-- Find Orders with invalid references
SELECT o.id FROM "Order" o 
WHERE o."productId" NOT IN (SELECT id FROM "Product")
   OR o."buyerId" NOT IN (SELECT id FROM "User")
   OR o."sellerId" NOT IN (SELECT id FROM "User");

-- Find Offers with invalid references  
SELECT o.id FROM "Offer" o 
WHERE o."productId" NOT IN (SELECT id FROM "Product")
   OR o."buyerId" NOT IN (SELECT id FROM "User")
   OR o."sellerId" NOT IN (SELECT id FROM "User");

-- Find Messages with invalid references
SELECT m.id FROM "Message" m 
WHERE m."buyerId" NOT IN (SELECT id FROM "User")
   OR m."sellerId" NOT IN (SELECT id FROM "User")
   OR m."productId" NOT IN (SELECT id FROM "Product");

-- ============================================
-- FIX ISSUES - If you find broken references
-- ============================================

-- Delete Orders with invalid product references
DELETE FROM "Order" WHERE "productId" NOT IN (SELECT id FROM "Product");

-- Delete Offers with invalid product references
DELETE FROM "Offer" WHERE "productId" NOT IN (SELECT id FROM "Product");

-- Delete Messages with invalid references
DELETE FROM "Message" WHERE "buyerId" NOT IN (SELECT id FROM "User")
   OR "sellerId" NOT IN (SELECT id FROM "User")
   OR "productId" NOT IN (SELECT id FROM "Product");

-- Update products with stock = 0 to stock = 1 (ensure products have stock)
UPDATE "Product" SET stock = 1 WHERE stock = 0 OR stock IS NULL;

-- ============================================
