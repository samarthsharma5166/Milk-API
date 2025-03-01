/*
  Warnings:

  - You are about to drop the column `otp` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `otpExpiresAt` on the `Delivery` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Delivery" DROP COLUMN "otp",
DROP COLUMN "otpExpiresAt";

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "otp" TEXT,
ADD COLUMN     "otpExpiresAt" TIMESTAMP(3);
