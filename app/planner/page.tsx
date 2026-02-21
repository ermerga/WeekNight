import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

// Helper to get start of current week (Sunday)                                                                                         
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

export default async function PlannerPage({
    searchParams
}: {
    searchParams: Promise<{ week?: string }>
}) {
    const session = await auth()

    if (!session) {
        redirect("/api/auth/signin")
    }

    // Parse week from URL or default to current week                                                                                   
    const params = await searchParams
    const weekParam = params.week
    const baseDate = weekParam ? new Date(weekParam + "T00:00:00") : new Date()
    const weekStart = getWeekStart(baseDate)
    const today = new Date()

    // Calculate prev/next weeks for navigation                                                                                         
    const prevWeek = new Date(weekStart)
    prevWeek.setDate(prevWeek.getDate() - 7)

    const nextWeek = new Date(weekStart)
    nextWeek.setDate(nextWeek.getDate() + 7)

    const mealPlan = await prisma.mealPlan.findFirst({
        where: {
            userId: session.user?.id,
            weekStartDate: weekStart,
        },
        include: {
            plannedMeals: {
                include: {
                    meal: true,
                },
                orderBy: { date: "asc" },
            },
        },
    })

    // Generate array of 7 days for the week                                                                                            
    const days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(weekStart)
        date.setDate(date.getDate() + i)
        return date
    })

    // Count total meals planned                                                                                                        
    const totalMeals = mealPlan?.plannedMeals.length || 0

    return (
        <main className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Meal Plan</h1>
                    {/* Week navigation */}
                    <div className="flex items-center gap-4 mt-1">
                        <Link
                            href={`/planner?week=${formatDateForUrl(prevWeek)}`}
                            className="text-gray-500 hover:text-gray-900"
                        >
                            ← Prev
                        </Link>
                        <p className="text-gray-500">
                            Week of {weekStart.toLocaleDateString()}
                        </p>
                        <Link
                            href={`/planner?week=${formatDateForUrl(nextWeek)}`}
                            className="text-gray-500 hover:text-gray-900"
                        >
                            Next →
                        </Link>
                    </div>
                </div>
                <div className="flex gap-3">
                    <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                        {totalMeals} meals planned
                    </span>
                    <Link
                        href="/shopping-list"
                        className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full hover:bg-green-200 transition-colors"
                    >
                        View Shopping List →
                    </Link>
                </div>
            </div>

            {/* Weekly Calendar Grid */}
            <div className="grid grid-cols-7 gap-3">
                {days.map((day) => {
                    const dayName = day.toLocaleDateString("en-US", {
                        weekday: "short"
                    })
                    const dayNum = day.getDate()
                    const isToday = day.toDateString() === today.toDateString()

                    const dayMeals = mealPlan?.plannedMeals.filter((pm) => {
                        const pmDate = new Date(pm.date)
                        return pmDate.toDateString() === day.toDateString()
                    }) || []

                    return (
                        <div
                            key={day.toISOString()}
                            className={`bg-white rounded-lg shadow min-h-[200px] flex flex-col ${isToday ? "ring-2 ring-blue-500" : ""
                                }`}
                        >
                            {/* Day Header */}
                            <div className={`p-3 border-b text-center ${isToday ? "bg-blue-500 text-white" : "bg-gray-50"
                                }`}>
                                <div className={`text-xs uppercase tracking-wide ${isToday ? "text-blue-100" : "text-gray-500"
                                    }`}>
                                    {dayName}
                                </div>
                                <div className={`text-xl font-bold ${isToday ? "text-white" : "text-gray-900"
                                    }`}>
                                    {dayNum}
                                </div>
                            </div>

                            {/* Meals */}
                            <div className="p-2 flex-1">
                                {dayMeals.length === 0 ? (
                                    <p className="text-gray-400 text-sm text-center mt-4">
                                        No meals
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {dayMeals.map((pm) => (
                                            <div
                                                key={pm.id}
                                                className="bg-gray-50 rounded p-2 text-sm"
                                            >
                                                <div className="text-xs text-gray-500 uppercase">
                                                    {pm.mealType}
                                                </div>
                                                <div className="font-medium text-gray-900 truncate">
                                                    {pm.meal.name}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Empty State / Help */}
            {totalMeals === 0 && (
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                    <p className="text-blue-800 mb-2">
                        No meals planned yet for this week.
                    </p>
                    <p className="text-blue-600 text-sm">
                        Use the AI chat to plan your meals.
                    </p>
                </div>
            )}
        </main>
    )
}  