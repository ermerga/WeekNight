import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import ShoppingListItems from "@/components/shopping-list/ShoppingListItems"

function getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    d.setDate(d.getDate() - day)
    d.setHours(0, 0, 0, 0)
    return d
}

function formatDateForUrl(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export default async function ShoppingListPage({
    searchParams
}: {
    searchParams: Promise<{ week?: string }>
}) {
    const session = await auth()

    if (!session) {
        redirect("/signin")
    }

    // Parse week from URL or default to current week
    const params = await searchParams
    const weekParam = params.week
    const baseDate = weekParam ? new Date(weekParam + "T00:00:00") : new Date()
    const weekStart = getWeekStart(baseDate)

    // Calculate prev/next weeks for navigation
    const prevWeek = new Date(weekStart)
    prevWeek.setDate(prevWeek.getDate() - 7)

    const nextWeek = new Date(weekStart)
    nextWeek.setDate(nextWeek.getDate() + 7)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

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

    const miscItems = await prisma.shoppingList.findFirst({
        where: {
            userId: session.user?.id,
            weekStartDate: weekStart
        },
        include: {
            items: true
        }
    })

    const miscShoppingItems = (miscItems?.items || []).map((item) => ({
        name: item.name,
        toBuy: item.quantity ?? null,
        unit: item.unit ?? null,
        inStock: undefined
    }))

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
        const inStock = inventory.find((inv) => inv.foodItemId === needed.foodItemId)
        const inStockQty = inStock?.quantity || 0
        const toBuy = Math.max(0, needed.quantity - inStockQty)

        return {
            ...needed,
            inStock: inStockQty,
            toBuy,
        }
    }).filter((item) => item.toBuy > 0)

    const combinedList = [...shoppingList, ...miscShoppingItems]

    return (
        <main className="bg-gray-100 min-h-[calc(100vh-60px)]"><div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Shopping List</h1>
                    {/* Week navigation */}
                    <div className="flex items-center gap-4 mt-1">
                        <Link
                            href={`/shopping-list?week=${formatDateForUrl(prevWeek)}`}
                            className="text-gray-700 hover:text-gray-900"
                        >
                            ← Prev
                        </Link>
                        <p className="text-gray-900">
                            Week of {weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                        <Link
                            href={`/shopping-list?week=${formatDateForUrl(nextWeek)}`}
                            className="text-gray-700 hover:text-gray-900"
                        >
                            Next →
                        </Link>
                    </div>
                </div>
                <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    {shoppingList.length} items to buy
                </span>
            </div>

            <div className="bg-white rounded-lg shadow">
                {!mealPlan && combinedList.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-900 mb-4">No meal plan for this week.</p>
                        <Link
                            href="/planner"
                            className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Go to Planner →
                        </Link>
                    </div>
                ) : combinedList.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="text-4xl mb-2">✓</div>
                        <p className="text-green-600 font-medium">You have everything you need!</p>
                        <p className="text-gray-900 text-sm">No items to buy this week.</p>
                    </div>
                ) : (
                    <ShoppingListItems
                        items={combinedList}
                        weekKey={formatDateForUrl(weekStart)}
                    />
                )}
            </div>
        </div></main>
    )
}