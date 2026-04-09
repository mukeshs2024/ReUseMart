-- Create message sender enum for two-way chat direction
CREATE TYPE "MessageSender" AS ENUM ('BUYER', 'SELLER');

-- Add senderType to message records so both buyers and sellers can reply
ALTER TABLE "Message"
ADD COLUMN "senderType" "MessageSender" NOT NULL DEFAULT 'BUYER';
