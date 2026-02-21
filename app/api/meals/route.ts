// MEALS API - /api/meals
// Handles HTTP requests for meal/recipe operations
// GET: Fetch all meals, with optional search/filter
// POST: Create a new meal/recipe
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    // 1. Check if user is logged in                                                                                                      
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Parse the request body                                                                                                          
    const body = await request.json()
    const { name, description, servings, prepTime, cuisine, ingredients } = body

    // 3. Validate required fields                                                                                                        
    if (!name || !servings || !ingredients?.length) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 4. Create the meal with ingredients in one query                                                                                   
    const meal = await prisma.meal.create({
        data: {
            userId: session.user.id,
            name,
            description,
            servings: parseInt(servings),
            prepTime: prepTime ? parseInt(prepTime) : null,
            cuisine,
            ingredients: {
                create: ingredients.map((ing: { foodItemId: string; quantity: string; unit: string }) => ({
                    foodItemId: ing.foodItemId,
                    quantity: parseFloat(ing.quantity),
                    unit: ing.unit,
                })),
            },
        },
        include: {
            ingredients: {
                include: {
                    foodItem: true,
                },
            },
        },
    })

    // 5. Return the created meal                                                                                                         
    return NextResponse.json(meal, { status: 201 })
}