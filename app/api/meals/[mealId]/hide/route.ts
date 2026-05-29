import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(_request: Request, { params }: { params: Promise<{ mealId: string }> }) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { mealId } = await params
    const meal = await prisma.meal.findUnique({ where: { id: mealId } })

    if (!meal || meal.userId !== session.user.id) {
        return NextResponse.json({ error: "Meal not found or not yours" }, { status: 404 })
    }

    const updated = await prisma.meal.update({
        where: { id: mealId },
        data: { hidden: !meal.hidden },
    })

    return NextResponse.json({ hidden: updated.hidden })
}
