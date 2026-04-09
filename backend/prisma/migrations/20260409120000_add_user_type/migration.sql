-- Create user account type enum
CREATE TYPE "UserType" AS ENUM ('BUYER', 'SELLER', 'BOTH');

-- Add explicit user account type to users table
ALTER TABLE "User"
ADD COLUMN "userType" "UserType" NOT NULL DEFAULT 'BUYER';

-- Backfill existing users: current sellers become BOTH, everyone else BUYER
UPDATE "User"
SET "userType" = CASE
    WHEN "isSeller" = true THEN 'BOTH'::"UserType"
    ELSE 'BUYER'::"UserType"
END;
