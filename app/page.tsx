import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import ChatBox from "@/components/chat/ChatBox"
import SignOutButton from "@/components/SignOutButton"

function getWeekStart(date: Date): Date {
    const d = new Date(date)
    d.setDate(d.getDate() - d.getDay())
    d.setHours(0, 0, 0, 0)
    return d
}

function formatDateForUrl(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

export default async function Home({
    searchParams,
}: {
    searchParams: Promise<{ week?: string }>
}) {
    const session = await auth()
    if (!session) redirect("/signin")

    const params = await searchParams
    const weekParam = params.week
    const baseDate = weekParam ? new Date(weekParam + "T00:00:00") : new Date()
    const weekStart = getWeekStart(baseDate)
    const today = new Date()

    const prevWeek = new Date(weekStart)
    prevWeek.setDate(prevWeek.getDate() - 7)

    const nextWeek = new Date(weekStart)
    nextWeek.setDate(nextWeek.getDate() + 7)

    const mealPlan = await prisma.mealPlan.findFirst({
        where: { userId: session.user?.id, weekStartDate: weekStart },
        include: {
            plannedMeals: {
                include: { meal: true },
                orderBy: { date: "asc" },
            },
        },
    })

    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart)
        d.setDate(d.getDate() + i)
        return d
    })

    const totalMeals = mealPlan?.plannedMeals.length ?? 0

    return (
        <div className="h-[calc(100vh-60px)] bg-gray-100 flex flex-col md:flex-row overflow-hidden md:p-6 md:gap-4">

            {/* Planner — bottom on mobile, left card on desktop */}
            <div className="order-2 md:order-1 h-60 md:h-auto md:w-80 flex-shrink-0 bg-white border-t md:border-t-0 md:rounded-xl md:shadow-sm md:border border-gray-200 flex flex-col overflow-hidden">

                {/* Header — same structure as chat header */}
                <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-gray-900 text-sm">
                                {session.user?.name?.split(" ")[0]}&apos;s week
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Link href={`/?week=${formatDateForUrl(prevWeek)}`} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
                                    ← Prev
                                </Link>
                                <span className="text-xs text-gray-400">·</span>
                                <span className="text-xs text-gray-500">
                                    {weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </span>
                                <span className="text-xs text-gray-400">·</span>
                                <Link href={`/?week=${formatDateForUrl(nextWeek)}`} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
                                    Next →
                                </Link>
                            </div>
                        </div>
                        <SignOutButton />
                    </div>
                </div>

                {/* Day list — horizontal scroll on mobile, vertical on desktop */}
                <div className="flex-1 flex flex-row md:flex-col overflow-x-auto md:overflow-x-hidden overflow-y-hidden md:overflow-y-auto">
                    {days.map((day) => {
                        const isToday = day.toDateString() === today.toDateString()
                        const dayLabel = day.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                        const dayMeals = mealPlan?.plannedMeals.filter(
                            (pm) => new Date(pm.date).toDateString() === day.toDateString()
                        ) ?? []

                        return (
                            <div
                                key={day.toISOString()}
                                className={`flex-shrink-0 w-32 md:w-auto border-r md:border-r-0 md:border-b border-gray-100 px-3 md:px-4 py-2.5 flex flex-col ${isToday ? "bg-blue-50" : ""}`}
                            >
                                <div className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${isToday ? "text-blue-600" : "text-gray-400"}`}>
                                    {dayLabel}{isToday && " · Today"}
                                </div>

                                {dayMeals.length === 0 ? (
                                    <p className="text-gray-400 text-xs italic">No meals</p>
                                ) : (
                                    <div className="space-y-1">
                                        {dayMeals.map((pm) => (
                                            <div key={pm.id} className="flex items-start justify-between gap-1">
                                                <div className="min-w-0">
                                                    <span className="text-[10px] uppercase text-gray-400 block">{pm.mealType}</span>
                                                    <span className="text-xs font-medium text-gray-900 truncate block">{pm.meal.name}</span>
                                                </div>
                                                <Link
                                                    href={`/cook/${pm.id}`}
                                                    className="flex-shrink-0 text-[10px] text-white bg-gray-900 rounded px-2 py-1 hover:bg-gray-700 mt-0.5 min-h-[28px] flex items-center"
                                                >
                                                    {pm.isCompleted ? "✓" : "Cook"}
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-xs text-gray-500">{totalMeals} {totalMeals === 1 ? "meal" : "meals"} planned</span>
                    <Link
                        href="/shopping-list"
                        className="text-xs bg-green-100 text-green-800 px-2.5 py-1 rounded-full hover:bg-green-200 transition-colors"
                    >
                        Shopping List →
                    </Link>
                </div>
            </div>

            {/* Chat — top on mobile, right card on desktop */}
            <div className="order-1 md:order-2 flex-1 bg-white border-b md:border-b-0 md:rounded-xl md:shadow-sm md:border border-gray-200 flex flex-col overflow-hidden min-h-0">
                <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200">
                    <h1 className="font-semibold text-gray-900 text-sm">Plan your week</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Ask me to add, remove, or suggest meals</p>
                </div>
                <div className="flex-1 overflow-hidden min-h-0">
                    <ChatBox />
                </div>
            </div>
        </div>
    )
}
