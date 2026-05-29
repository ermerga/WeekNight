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
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
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

    const params = await searchParams
    const weekParam = params.week
    const baseDate = weekParam ? new Date(weekParam + "T00:00:00") : new Date()
    const weekStart = getWeekStart(baseDate)

    const prevWeek = new Date(weekStart)
    prevWeek.setDate(prevWeek.getDate() - 7)

    const nextWeek = new Date(weekStart)
    nextWeek.setDate(nextWeek.getDate() + 7)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

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

    const inventory = await prisma.inventoryItem.findMany({
        where: { userId: session.user?.id },
        include: { foodItem: true },
    })

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

    const shoppingList = Array.from(ingredientsNeeded.values()).map((needed) => {
        const inStock = inventory.find((inv) => inv.foodItemId === needed.foodItemId)
        const inStockQty = inStock?.quantity || 0
        const toBuy = Math.max(0, needed.quantity - inStockQty)
        return { ...needed, inStock: inStockQty, toBuy }
    }).filter((item) => item.toBuy > 0)

    const combinedList = [...shoppingList, ...miscShoppingItems]

    const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`

    return (
        <main className="bg-[#FAF9F6] min-h-[calc(100vh-60px)]">
            <div className="max-w-4xl mx-auto p-6">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Shopping List</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {combinedList.length > 0
                                ? `${combinedList.length} item${combinedList.length !== 1 ? "s" : ""} to buy`
                                : "All stocked up"}
                        </p>
                    </div>
                    {combinedList.length > 0 && (
                        <span className="text-sm bg-[#EEF5F0] text-[#2D6A4F] px-3 py-1 rounded-full font-medium">
                            {shoppingList.length} from meals
                        </span>
                    )}
                </div>

                {/* Week navigation */}
                <div className="flex items-center justify-between mb-4 bg-white rounded-xl border border-[#E8E5DF] px-4 py-3">
                    <Link
                        href={`/shopping-list?week=${formatDateForUrl(prevWeek)}`}
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 min-h-[44px] px-1"
                    >
                        ← Prev
                    </Link>
                    <span className="text-sm font-medium text-gray-900">{weekLabel}</span>
                    <Link
                        href={`/shopping-list?week=${formatDateForUrl(nextWeek)}`}
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 min-h-[44px] px-1"
                    >
                        Next →
                    </Link>
                </div>

                {/* List */}
                <div className="bg-white rounded-xl border border-[#E8E5DF]">
                    {!mealPlan && combinedList.length === 0 ? (
                        <div className="p-10 text-center">
                            <p className="text-gray-500 text-sm mb-3">No meal plan for this week.</p>
                            <Link
                                href="/"
                                className="text-sm text-[#2D6A4F] hover:text-[#1B5E40] font-medium"
                            >
                                Go to Planner →
                            </Link>
                        </div>
                    ) : combinedList.length === 0 ? (
                        <div className="p-10 text-center">
                            <div className="text-3xl mb-2">✓</div>
                            <p className="text-[#2D6A4F] font-medium text-sm">You have everything you need!</p>
                            <p className="text-gray-400 text-sm mt-1">Nothing to buy this week.</p>
                        </div>
                    ) : (
                        <ShoppingListItems
                            items={combinedList}
                            weekKey={formatDateForUrl(weekStart)}
                        />
                    )}
                </div>
            </div>
        </main>
    )
}
