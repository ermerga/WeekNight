import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// Helper to get start of week (same as in page)                                                                                        
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

    const body = await request.json()
    const { mealId, date, mealType = "dinner" } = body

    if (!mealId || !date) {
        return NextResponse.json({ error: "Missing mealId or date" }, { status: 400 })
    }

    const mealDate = new Date(date)
    const weekStart = getWeekStart(mealDate)

    // Find or create the meal plan for this week                                                                                         
    let mealPlan = await prisma.mealPlan.findFirst({
        where: {
            userId: session.user.id,
            weekStartDate: weekStart,
        },
    })

    if (!mealPlan) {
        mealPlan = await prisma.mealPlan.create({
            data: {
                userId: session.user.id,
                weekStartDate: weekStart,
            },
        })
    }

    // Add the planned meal                                                                                                               
    const plannedMeal = await prisma.plannedMeal.create({
        data: {
            mealPlanId: mealPlan.id,
            mealId,
            date: mealDate,
            mealType,
        },
        include: {
            meal: true,
        },
    })

    return NextResponse.json(plannedMeal, { status: 201 })
}