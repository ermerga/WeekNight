import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(
    request: Request,
    { params }: { params: Promise<{ plannedMealId: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { plannedMealId } = await params

    const plannedMeal = await prisma.plannedMeal.findUnique({
        where: { id: plannedMealId },
        include: { mealPlan: true },
    })

    if (!plannedMeal || plannedMeal.mealPlan.userId !== session.user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.plannedMeal.update({
        where: { id: plannedMealId },
        data: { isCompleted: true },
    })

    return NextResponse.json({ success: true })
}
