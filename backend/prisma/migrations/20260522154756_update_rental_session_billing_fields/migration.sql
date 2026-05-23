/*
  Warnings:

  - You are about to drop the column `elapsedSeconds` on the `RentalSession` table. All the data in the column will be lost.
  - You are about to drop the column `endedAt` on the `RentalSession` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `RentalSession` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RentalSession" DROP COLUMN "elapsedSeconds",
DROP COLUMN "endedAt",
DROP COLUMN "startedAt",
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "expectedEndTime" TIMESTAMP(3),
ADD COLUMN     "startTime" TIMESTAMP(3);
