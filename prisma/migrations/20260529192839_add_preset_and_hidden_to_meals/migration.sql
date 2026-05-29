/*
  Warnings:

  - You are about to drop the column `foodItemId` on the `shopping_list_items` table. All the data in the column will be lost.
  - You are about to drop the column `mealPlanId` on the `shopping_lists` table. All the data in the column will be lost.
  - Added the required column `name` to the `shopping_list_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weekStartDate` to the `shopping_lists` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "shopping_list_items" DROP CONSTRAINT "shopping_list_items_foodItemId_fkey";

-- DropIndex
DROP INDEX "shopping_list_items_foodItemId_idx";

-- AlterTable
ALTER TABLE "meals" ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPreset" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "steps" TEXT[];

-- AlterTable
ALTER TABLE "shopping_list_items" DROP COLUMN "foodItemId",
ADD COLUMN     "name" TEXT NOT NULL,
ALTER COLUMN "quantity" DROP NOT NULL,
ALTER COLUMN "unit" DROP NOT NULL;

-- AlterTable
ALTER TABLE "shopping_lists" DROP COLUMN "mealPlanId",
ADD COLUMN     "weekStartDate" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password" TEXT;
