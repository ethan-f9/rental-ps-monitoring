/*
  Warnings:

  - You are about to drop the column `isOnline` on the `SmartPlugDevice` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `SmartPlugDevice` table. All the data in the column will be lost.
  - Added the required column `clientId` to the `SmartPlugDevice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientSecret` to the `SmartPlugDevice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SmartPlugDevice" DROP COLUMN "isOnline",
DROP COLUMN "name",
ADD COLUMN     "clientId" TEXT NOT NULL,
ADD COLUMN     "clientSecret" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
