-- CreateEnum
CREATE TYPE "ActiveMode" AS ENUM ('BUYER', 'SELLER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "activeMode" "ActiveMode" NOT NULL DEFAULT 'BUYER';
