-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_rentalSessionId_fkey";

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "rentalSessionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_rentalSessionId_fkey" FOREIGN KEY ("rentalSessionId") REFERENCES "RentalSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
