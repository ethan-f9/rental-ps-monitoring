/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Package` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `PlayStationUnit` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('IDLE');

-- AlterTable
ALTER TABLE "PlayStationUnit" ADD COLUMN     "status" "UnitStatus" NOT NULL DEFAULT 'IDLE';

-- CreateIndex
CREATE UNIQUE INDEX "Package_name_key" ON "Package"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PlayStationUnit_name_key" ON "PlayStationUnit"("name");
