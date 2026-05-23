/*
  Warnings:

  - You are about to drop the column `price` on the `Package` table. All the data in the column will be lost.
  - Added the required column `flatPrice` to the `Package` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitId` to the `Package` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pricePerHour` to the `PlayStationUnit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Package" DROP COLUMN "price",
ADD COLUMN     "flatPrice" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "unitId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PlayStationUnit" ADD COLUMN     "pricePerHour" DECIMAL(65,30) NOT NULL;

-- AlterTable
ALTER TABLE "RentalSession" ADD COLUMN     "extendedMinutes" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PackageFnbItem" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "PackageFnbItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PackageFnbItem_packageId_menuItemId_key" ON "PackageFnbItem"("packageId", "menuItemId");

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "PlayStationUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageFnbItem" ADD CONSTRAINT "PackageFnbItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageFnbItem" ADD CONSTRAINT "PackageFnbItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
