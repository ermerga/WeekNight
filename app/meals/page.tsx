import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import MealActions from "@/components/meals/MealActions"
import AddMealModal from "@/components/meals/AddMealModal"

export default async function MealsPage() {
    const session = await auth()

    if (!session) {
        redirect("/api/auth/signin")
    }

    const meals = await prisma.meal.findMany({
        where: {
            OR: [
                { userId: session.user?.id },
                { isPublic: true },
            ],
        },
        include: {
            ingredients: {
                include: {
                    foodItem: true,
                },
            },
        },
        orderBy: { name: "asc" },
    })

    const foodItems = await prisma.foodItem.findMany({
        orderBy: { name: "asc" }
    })

    return (
        <main className="bg-[#FAF9F6] min-h-[calc(100vh-60px)]">
            <div className="max-w-4xl mx-auto p-6">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Meals</h1>
                        <p className="text-sm text-gray-500 mt-0.5">{meals.length} recipe{meals.length !== 1 ? "s" : ""} saved</p>
                    </div>
                    <AddMealModal foodItems={foodItems} />
                </div>

                {/* Meals Grid */}
                {meals.length === 0 ? (
                    <div className="bg-white rounded-xl border border-[#E8E5DF] p-12 text-center">
                        <p className="text-gray-500 text-sm mb-4">No meals yet. Add your first recipe to get started.</p>
                        <AddMealModal foodItems={foodItems} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {meals.map((meal) => (
                            <div
                                key={meal.id}
                                className="bg-white rounded-xl border border-[#E8E5DF] hover:shadow-md transition-shadow"
                            >
                                <div className="p-5">
                                    {/* Meal name + cuisine tag */}
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h2 className="text-base font-semibold text-gray-900 leading-snug">{meal.name}</h2>
                                        {meal.cuisine && (
                                            <span className="flex-shrink-0 bg-[#EEF5F0] text-[#2D6A4F] px-2 py-0.5 rounded-md text-xs font-medium">
                                                {meal.cuisine}
                                            </span>
                                        )}
                                    </div>

                                    {/* Meta row */}
                                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                                        {meal.prepTime && <span>{meal.prepTime} min</span>}
                                        <span>{meal.servings} servings</span>
                                    </div>

                                    {meal.description && (
                                        <p className="text-gray-600 text-sm mb-3 leading-relaxed">{meal.description}</p>
                                    )}

                                    {/* Ingredients expand */}
                                    <details className="text-sm">
                                        <summary className="cursor-pointer text-[#2D6A4F] hover:text-[#1B5E40] font-medium text-xs select-none">
                                            {meal.ingredients.length} ingredient{meal.ingredients.length !== 1 ? "s" : ""}
                                        </summary>
                                        <ul className="mt-2 space-y-0.5 text-xs text-gray-600 pl-1">
                                            {meal.ingredients.map((ing) => (
                                                <li key={ing.id} className="flex gap-1">
                                                    <span className="text-gray-400">·</span>
                                                    {ing.quantity} {ing.unit} {ing.foodItem.name}
                                                </li>
                                            ))}
                                        </ul>
                                    </details>

                                    {meal.userId === session.user?.id && (
                                        <MealActions
                                            meal={{
                                                ...meal,
                                                ingredients: meal.ingredients.map((i) => ({
                                                    foodItemId: i.foodItemId,
                                                    quantity: i.quantity,
                                                    unit: i.unit,
                                                })),
                                            }}
                                            foodItems={foodItems}
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}
