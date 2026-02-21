import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

type SearchMealsInput = {
    query?: string      // Search by name                                      
    cuisine?: string    // Filter by cuisine                                   
}

export async function POST(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: SearchMealsInput = await request.json()
    const { query, cuisine } = body

    try {
        const meals = await prisma.meal.findMany({
            where: {
                AND: [
                    // User's meals or public meals                                    
                    {
                        OR: [
                            { userId: session.user.id },
                            { isPublic: true },
                        ],
                    },
                    // Search by name if provided                                      
                    query
                        ? {
                            name: {
                                contains: query,
                                mode: "insensitive",
                            },
                        }
                        : {},
                    // Filter by cuisine if provided                                   
                    cuisine
                        ? {
                            cuisine: {
                                equals: cuisine,
                                mode: "insensitive",
                            },
                        }
                        : {},
                ],
            },
            include: {
                ingredients: {
                    include: {
                        foodItem: true,
                    },
                },
            },
            orderBy: { name: "asc" },
            take: 10, // Limit results                                             
        })

        return NextResponse.json({
            success: true,
            count: meals.length,
            meals: meals.map((meal) => ({
                id: meal.id,
                name: meal.name,
                description: meal.description,
                servings: meal.servings,
                prepTime: meal.prepTime,
                cuisine: meal.cuisine,
                ingredients: meal.ingredients.map((ing) => ({
                    name: ing.foodItem.name,
                    quantity: ing.quantity,
                    unit: ing.unit,
                })),
            })),
        })
    } catch (error) {
        console.error("Error searching meals:", error)
        return NextResponse.json(
            { error: "Failed to search meals" },
            { status: 500 }
        )
    }
}