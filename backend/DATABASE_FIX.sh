#!/bin/bash
# DATABASE VERIFICATION AND FIX SCRIPT
# This script checks all tables and fixes any data storage issues

echo "================================"
echo "ReUseMart Database Fix Guide"
echo "================================"
echo ""
echo "STEP 1: Connect to your Supabase PostgreSQL database"
echo "  URL: https://supabase.co/dashboard"
echo "  Connection String (from Project Settings > Database):"
echo "    postgresql://[user]:[password]@db.[project-id].supabase.co:5432/postgres"
echo ""
echo "STEP 2: Run these SQL commands in the SQL Editor"
echo ""
echo "STEP 3: Copy each SQL block below and run it"
echo ""
echo "================================"
echo ""

cat << 'EOF'

-- ============================================
-- BLOCK 1: CHECK EXISTING TABLES
-- ============================================
-- Run this to see all tables in your database
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Count all records
SELECT 
    'User' as table_name, COUNT(*) as count FROM "User"
UNION ALL SELECT 'Product', COUNT(*) FROM "Product"
UNION ALL SELECT 'Order', COUNT(*) FROM "Order"
UNION ALL SELECT 'Offer', COUNT(*) FROM "Offer"
UNION ALL SELECT 'Message', COUNT(*) FROM "Message"
UNION ALL SELECT 'Rating', COUNT(*) FROM "Rating"
ORDER BY table_name;

-- ============================================
-- BLOCK 2: VERIFY USER TABLE
-- ============================================
-- Check if User table has all required columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'User' 
ORDER BY ordinal_position;

-- Sample User data
SELECT id, name, email, isSeller, userType, trustScore, "createdAt" 
FROM "User" 
LIMIT 10;

-- ============================================
-- BLOCK 3: VERIFY PRODUCT TABLE
-- ============================================
-- Check if Product table has all required columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Product' 
ORDER BY ordinal_position;

-- Sample Product data
SELECT id, title, price, stock, category, condition, "sellerId", "createdAt" 
FROM "Product" 
LIMIT 10;

-- Count products by category
SELECT category, COUNT(*) as count 
FROM "Product" 
GROUP BY category 
ORDER BY count DESC;

-- ============================================
-- BLOCK 4: FIX DATA ISSUES
-- ============================================

-- 1. Ensure all products have stock > 0
UPDATE "Product" 
SET stock = 1 
WHERE stock IS NULL OR stock <= 0;

-- 2. Ensure all products have valid seller references
DELETE FROM "Product" 
WHERE "sellerId" NOT IN (SELECT id FROM "User");

-- 3. Ensure all orders have valid references
DELETE FROM "Order" 
WHERE "productId" NOT IN (SELECT id FROM "Product")
   OR "buyerId" NOT IN (SELECT id FROM "User")
   OR "sellerId" NOT IN (SELECT id FROM "User");

-- 4. Ensure all offers have valid references
DELETE FROM "Offer" 
WHERE "productId" NOT IN (SELECT id FROM "Product")
   OR "buyerId" NOT IN (SELECT id FROM "User")
   OR "sellerId" NOT IN (SELECT id FROM "User");

-- 5. Ensure all messages have valid references
DELETE FROM "Message" 
WHERE "buyerId" NOT IN (SELECT id FROM "User")
   OR "sellerId" NOT IN (SELECT id FROM "User")
   OR "productId" NOT IN (SELECT id FROM "Product");

-- 6. Ensure all ratings have valid references
DELETE FROM "Rating" 
WHERE "buyerId" NOT IN (SELECT id FROM "User")
   OR (productId IS NOT NULL AND "productId" NOT IN (SELECT id FROM "Product"))
   OR ("sellerId" IS NOT NULL AND "sellerId" NOT IN (SELECT id FROM "User"));

-- ============================================
-- BLOCK 5: VERIFY DATA INTEGRITY
-- ============================================

-- Check for broken product references
SELECT COUNT(*) as broken_products
FROM "Product" p 
WHERE p."sellerId" NOT IN (SELECT id FROM "User");

-- Check for broken orders
SELECT COUNT(*) as broken_orders
FROM "Order" o 
WHERE o."productId" NOT IN (SELECT id FROM "Product")
   OR o."buyerId" NOT IN (SELECT id FROM "User")
   OR o."sellerId" NOT IN (SELECT id FROM "User");

-- Check for broken offers
SELECT COUNT(*) as broken_offers
FROM "Offer" o 
WHERE o."productId" NOT IN (SELECT id FROM "Product")
   OR o."buyerId" NOT IN (SELECT id FROM "User")
   OR o."sellerId" NOT IN (SELECT id FROM "User");

-- ============================================
-- BLOCK 6: DETAILED DATA VIEW
-- ============================================

-- View Orders with all details
SELECT 
    o.id as order_id,
    o.amount,
    o.quantity,
    o.status,
    p.title as product_title,
    b.name as buyer_name,
    s.name as seller_name,
    o."createdAt"
FROM "Order" o 
LEFT JOIN "Product" p ON o."productId" = p.id 
LEFT JOIN "User" b ON o."buyerId" = b.id 
LEFT JOIN "User" s ON o."sellerId" = s.id 
ORDER BY o."createdAt" DESC
LIMIT 20;

-- View Offers with all details
SELECT 
    o.id as offer_id,
    o.price,
    o.status,
    p.title as product_title,
    b.name as buyer_name,
    s.name as seller_name,
    o."createdAt"
FROM "Offer" o 
LEFT JOIN "Product" p ON o."productId" = p.id 
LEFT JOIN "User" b ON o."buyerId" = b.id 
LEFT JOIN "User" s ON o."sellerId" = s.id 
ORDER BY o."createdAt" DESC
LIMIT 20;

-- View Messages with all details
SELECT 
    m.id as message_id,
    m.content,
    m."senderType",
    b.name as buyer_name,
    s.name as seller_name,
    p.title as product_title,
    m.isRead,
    m."createdAt"
FROM "Message" m 
LEFT JOIN "User" b ON m."buyerId" = b.id 
LEFT JOIN "User" s ON m."sellerId" = s.id 
LEFT JOIN "Product" p ON m."productId" = p.id 
ORDER BY m."createdAt" DESC
LIMIT 20;

-- ============================================
-- BLOCK 7: STATISTICS
-- ============================================

-- Total sellers
SELECT COUNT(DISTINCT "sellerId") as total_sellers FROM "Product";

-- Total buyers (from orders)
SELECT COUNT(DISTINCT "buyerId") as total_buyers FROM "Order";

-- Average products per seller
SELECT AVG(product_count) as avg_products_per_seller
FROM (SELECT COUNT(*) as product_count FROM "Product" GROUP BY "sellerId") as counts;

-- Products by condition
SELECT condition, COUNT(*) as count FROM "Product" GROUP BY condition;

-- Average product price
SELECT 
    ROUND(AVG(price)::numeric, 2) as avg_price,
    MIN(price) as min_price,
    MAX(price) as max_price
FROM "Product";

-- Orders by status
SELECT status, COUNT(*) as count FROM "Order" GROUP BY status;

-- Offers by status
SELECT status, COUNT(*) as count FROM "Offer" GROUP BY status;

EOF

echo ""
echo "================================"
echo "HOW TO USE THIS SCRIPT"
echo "================================"
echo ""
echo "1. Go to: https://supabase.co/dashboard"
echo "2. Open your project"
echo "3. Go to: SQL Editor"
echo "4. Copy each BLOCK above (one at a time)"
echo "5. Paste into the SQL editor"
echo "6. Click 'Run'"
echo "7. Check the results"
echo ""
echo "================================"
