import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ChatBox from "@/components/chat/ChatBox"
import PlannerPanel from "@/components/planner/PlannerPanel"

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

    const dayStrs = days.map(formatDateForUrl)
    const serializedMeals = mealPlan?.plannedMeals.map((pm) => ({
        id: pm.id,
        dateStr: formatDateForUrl(new Date(pm.date)),
        mealType: pm.mealType,
        isCompleted: pm.isCompleted,
        mealName: pm.meal.name,
    })) ?? []

    return (
        <div className="h-[calc(100vh-60px)] bg-gray-100 flex flex-col md:flex-row overflow-hidden md:p-6 md:gap-4">

            {/* Planner — bottom on mobile, left card on desktop */}
            <div className="order-2 md:order-1 md:w-80 flex-shrink-0 border-t md:border-t-0 md:rounded-xl md:shadow-sm md:border border-gray-200 flex flex-col overflow-hidden">
                <PlannerPanel
                    userName={session.user?.name?.split(" ")[0] ?? "You"}
                    weekStartStr={formatDateForUrl(weekStart)}
                    prevWeekUrl={`/?week=${formatDateForUrl(prevWeek)}`}
                    nextWeekUrl={`/?week=${formatDateForUrl(nextWeek)}`}
                    dayStrs={dayStrs}
                    plannedMeals={serializedMeals}
                    totalMeals={totalMeals}
                />
            </div>

            {/* Chat — top on mobile, right card on desktop */}
            <div className="order-1 md:order-2 flex-1 bg-white border-b md:border-b-0 md:rounded-xl md:shadow-sm md:border border-gray-200 flex flex-col overflow-hidden min-h-0">
                <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200">
                    <h1 className="font-semibold text-gray-900 text-base">Plan your week</h1>
                </div>
                <div className="flex-1 overflow-hidden min-h-0">
                    <ChatBox />
                </div>
            </div>
        </div>
    )
}
