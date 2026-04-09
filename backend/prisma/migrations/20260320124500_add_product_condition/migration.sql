-- CreateEnum
CREATE TYPE "ProductCondition" AS ENUM ('LIKE_NEW', 'USED', 'OLD', 'TOO_OLD');

-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "condition" "ProductCondition" NOT NULL DEFAULT 'USED';
