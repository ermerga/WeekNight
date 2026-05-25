import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

async function getOwnedMeal(mealId: string, userId: string) {
    const meal = await prisma.meal.findUnique({ where: { id: mealId } })
    if (!meal) return null
    if (meal.userId !== userId) return null
    return meal
}

export async function PUT(request: Request, { params }: { params: Promise<{ mealId: string }> }) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { mealId } = await params
    const meal = await getOwnedMeal(mealId, session.user.id)
    if (!meal) {
        return NextResponse.json({ error: "Meal not found or not yours" }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, servings, prepTime, cuisine, steps, ingredients } = body

    if (!name || !servings) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Replace ingredients by deleting and recreating
    await prisma.ingredient.deleteMany({ where: { mealId } })

    const updated = await prisma.meal.update({
        where: { id: mealId },
        data: {
            name,
            description: description || null,
            servings: parseInt(servings),
            prepTime: prepTime ? parseInt(prepTime) : null,
            cuisine: cuisine || null,
            steps: steps ?? [],
            ingredients: {
                create: (ingredients ?? []).map((ing: { foodItemId: string; quantity: string; unit: string }) => ({
                    foodItemId: ing.foodItemId,
                    quantity: parseFloat(ing.quantity),
                    unit: ing.unit,
                })),
            },
        },
        include: { ingredients: { include: { foodItem: true } } },
    })

    return NextResponse.json(updated)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ mealId: string }> }) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { mealId } = await params
    const meal = await getOwnedMeal(mealId, session.user.id)
    if (!meal) {
        return NextResponse.json({ error: "Meal not found or not yours" }, { status: 404 })
    }

    // PlannedMeal has no cascade on mealId, so delete dependents first
    await prisma.plannedMeal.deleteMany({ where: { mealId } })
    await prisma.meal.delete({ where: { id: mealId } })
    return NextResponse.json({ success: true })
}
