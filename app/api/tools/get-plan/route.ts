import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// Helper to get start of week                                               
function getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    d.setDate(d.getDate() - day)
    d.setHours(0, 0, 0, 0)
    return d
}

export async function POST(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const weekStart = getWeekStart(new Date())

    try {
        const mealPlan = await prisma.mealPlan.findFirst({
            where: {
                userId: session.user.id,
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

        if (!mealPlan) {
            return NextResponse.json({
                success: true,
                message: "No meal plan for this week yet",
                weekStart: weekStart.toISOString(),
                plannedMeals: [],
            })
        }

        return NextResponse.json({
            success: true,
            weekStart: weekStart.toISOString(),
            plannedMeals: mealPlan.plannedMeals.map((pm) => ({
                id: pm.id,
                date: pm.date.toISOString(),
                dayOfWeek: pm.date.toLocaleDateString("en-US", { weekday: "long" }),
                mealType: pm.mealType,
                meal: {
                    id: pm.meal.id,
                    name: pm.meal.name,
                },
                isCompleted: pm.isCompleted,
            })),
        })
    } catch (error) {
        console.error("Error getting plan:", error)
        return NextResponse.json(
            { error: "Failed to get meal plan" },
            { status: 500 }
        )
    }
}