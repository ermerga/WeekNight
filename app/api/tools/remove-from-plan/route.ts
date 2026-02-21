import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import Fuse from "fuse.js"

type RemoveFromPlanInput = {
    mealName: string
    date: string
    mealType?: "breakfast" | "lunch" | "dinner" | "snack"
}

export async function POST(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: RemoveFromPlanInput = await request.json()
    const { mealName, date, mealType } = body

    if (!mealName || !date) {
        return NextResponse.json(
            { error: "mealName and date are required" },
            { status: 400 }
        )
    }

    try {
        const mealDate = new Date(date + "T00:00:00")

        // Get all candidate meals (user's + public)                                                                                          
        const candidateMeals = await prisma.meal.findMany({
            where: {
                OR: [
                    { userId: session.user.id },
                    { isPublic: true }
                ]
            }
        })

        // Fuzzy match to find the meal                                                                                                       
        const fuse = new Fuse(candidateMeals, {
            keys: ['name'],
            threshold: 0.4,
            includeScore: true
        })

        const results = fuse.search(mealName)

        if (results.length === 0 || results[0].score! > 0.4) {
            return NextResponse.json({
                success: false,
                found: false,
                message: "Meal not found"
            })
        }

        const meal = results[0].item

        // Find the planned meal for this meal on this date                                                                                   
        const plannedMeal = await prisma.plannedMeal.findFirst({
            where: {
                mealId: meal.id,
                date: mealDate,
                ...(mealType && { mealType }),  // Only include if provided                                                                   
                mealPlan: {
                    userId: session.user.id
                }
            },
            include: {
                meal: true
            }
        })

        if (!plannedMeal) {
            return NextResponse.json({
                success: false,
                found: false,
                message: "No planned meal found for that date"
            })
        }

        // Delete the planned meal                                               
        await prisma.plannedMeal.delete({
            where: { id: plannedMeal.id },
        })

        return NextResponse.json({
            success: true,
            removed: {
                mealName: plannedMeal.meal.name,
                date: plannedMeal.date.toISOString(),
                mealType: plannedMeal.mealType,
            },
        })
    } catch (error) {
        console.error("Error removing from plan:", error)
        return NextResponse.json(
            { error: "Failed to remove meal from plan" },
            { status: 500 }
        )
    }
}