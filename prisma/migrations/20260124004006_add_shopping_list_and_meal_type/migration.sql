-- AlterTable
ALTER TABLE "planned_meals" ADD COLUMN     "mealType" TEXT NOT NULL DEFAULT 'dinner';

-- CreateTable
CREATE TABLE "shopping_lists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mealPlanId" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopping_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopping_list_items" (
    "id" TEXT NOT NULL,
    "shoppingListId" TEXT NOT NULL,
    "foodItemId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "isPurchased" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shopping_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shopping_lists_userId_idx" ON "shopping_lists"("userId");

-- CreateIndex
CREATE INDEX "shopping_list_items_shoppingListId_idx" ON "shopping_list_items"("shoppingListId");

-- CreateIndex
CREATE INDEX "shopping_list_items_foodItemId_idx" ON "shopping_list_items"("foodItemId");

-- AddForeignKey
ALTER TABLE "meal_history" ADD CONSTRAINT "meal_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_sessions" ADD CONSTRAINT "conversation_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_lists" ADD CONSTRAINT "shopping_lists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_shoppingListId_fkey" FOREIGN KEY ("shoppingListId") REFERENCES "shopping_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_foodItemId_fkey" FOREIGN KEY ("foodItemId") REFERENCES "food_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
