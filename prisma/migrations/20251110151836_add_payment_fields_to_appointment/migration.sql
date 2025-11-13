-- AlterTable
ALTER TABLE "appointments" ADD COLUMN "discountAmount" DECIMAL;
ALTER TABLE "appointments" ADD COLUMN "discountPercentage" DECIMAL;
ALTER TABLE "appointments" ADD COLUMN "finalAmount" DECIMAL;
ALTER TABLE "appointments" ADD COLUMN "originalAmount" DECIMAL;
ALTER TABLE "appointments" ADD COLUMN "paymentDate" DATETIME;
ALTER TABLE "appointments" ADD COLUMN "paymentMethod" TEXT;
ALTER TABLE "appointments" ADD COLUMN "paymentStatus" TEXT;
