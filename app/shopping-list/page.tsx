import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

// Helper to get start of week                                               
function getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    d.setDate(d.getDate() - day)
    d.setHours(0, 0, 0, 0)
    return d
}

export default async function ShoppingListPage() {
    const session = await auth()

    if (!session) {
        redirect("/api/auth/signin")
    }

    const weekStart = getWeekStart(new Date())

    // 1. Get the meal plan with all planned meals and their ingredients     
    const mealPlan = await prisma.mealPlan.findFirst({
        where: {
            userId: session.user?.id,
            weekStartDate: weekStart,
        },
        include: {
            plannedMeals: {
                include: {
                    meal: {
                        include: {
                            ingredients: {
                                include: {
                                    foodItem: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    })

    // 2. Get user's current inventory                                       
    const inventory = await prisma.inventoryItem.findMany({
        where: {
            userId: session.user?.id,
        },
        include: {
            foodItem: true,
        },
    })

    // 3. Aggregate ingredients needed from all planned meals                
    const ingredientsNeeded = new Map<string, {
        foodItemId: string
        name: string
        quantity: number
        unit: string
    }>()

    mealPlan?.plannedMeals.forEach((pm) => {
        pm.meal.ingredients.forEach((ing) => {
            const existing = ingredientsNeeded.get(ing.foodItemId)
            if (existing) {
                existing.quantity += ing.quantity
            } else {
                ingredientsNeeded.set(ing.foodItemId, {
                    foodItemId: ing.foodItemId,
                    name: ing.foodItem.name,
                    quantity: ing.quantity,
                    unit: ing.unit,
                })
            }
        })
    })

    // 4. Calculate what to buy (needed - inventory)                         
    const shoppingList = Array.from(ingredientsNeeded.values()).map((needed) => {
        const inStock = inventory.find((inv) => inv.foodItemId ===
            needed.foodItemId)
        const inStockQty = inStock?.quantity || 0
        const toBuy = Math.max(0, needed.quantity - inStockQty)

        return {
            ...needed,
            inStock: inStockQty,
            toBuy,
        }
    }).filter((item) => item.toBuy > 0)

    return (
        <main className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Shopping List</h1>
                    <p className="text-gray-500">Week of {weekStart.toLocaleDateString()}</p>
                </div>
                <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 
  rounded-full">
                    {shoppingList.length} items to buy
                </span>
            </div>

            <div className="bg-white rounded-lg shadow">
                {!mealPlan ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500 mb-4">No meal plan for
                            this week.</p>
                        <Link
                            href="/planner"
                            className="text-blue-600 hover:text-blue-800     
  font-medium"
                        >
                            Go to Planner →
                        </Link>
                    </div>
                ) : shoppingList.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="text-4xl mb-2">✓</div>
                        <p className="text-green-600 font-medium">You have
                            everything you need!</p>
                        <p className="text-gray-500 text-sm">No items to buy
                            this week.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {shoppingList.map((item) => (
                            <li key={item.foodItemId} className="p-4 flex    
  justify-between items-center hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded           
  border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span
                                        className="font-medium">{item.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="font-semibold           
  text-gray-900">
                                        {item.toBuy} {item.unit}
                                    </span>
                                    <span className="block text-sm           
  text-gray-400">
                                        need {item.quantity}, have
                                        {item.inStock}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </main>
    )
}