-- Fix product imageUrl to match categories
-- This migration updates existing products with category-appropriate images
UPDATE "Product" SET "imageUrl" = 
CASE
  WHEN "title" ILIKE '%usb%' OR "title" ILIKE '%adapter%' THEN '/images/electronics/usb-hub.svg'
  WHEN "title" ILIKE '%power%' THEN '/images/electronics/powerbank.svg'
  WHEN "title" ILIKE '%shoe%' OR "title" ILIKE '%running%' THEN '/images/fashion/shoes.svg'
  WHEN "title" ILIKE '%bag%' THEN '/images/fashion/bag.svg'
  ELSE '/images/default.svg'
END
WHERE "imageUrl" IS NULL OR "imageUrl" LIKE '%placehold.co%' OR "imageUrl" LIKE '%placeholder%' OR "imageUrl" = '';
