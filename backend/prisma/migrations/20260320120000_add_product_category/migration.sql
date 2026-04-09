-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('ELECTRONICS', 'MOBILES', 'FURNITURE', 'FASHION', 'ACCESSORIES');

-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "category" "ProductCategory" NOT NULL DEFAULT 'ELECTRONICS';
