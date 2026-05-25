import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { generateEmbedding } from "@/lib/embeddings"

type IngredientInput = {
    foodName: string
    quantity: number
    unit: string
    category?: string  // Optional - helps categorize new food items                        
}

type CreateMealInput = {
    name: string
    description?: string
    servings?: number
    prepTime?: number
    cuisine?: string
    steps?: string[]
    ingredients: IngredientInput[]
}

export async function POST(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: CreateMealInput = await request.json()
    const { name, description, servings = 4, prepTime, cuisine, steps = [], ingredients } = body

    // Validate required fields                                                             
    if (!name || !ingredients?.length) {
        return NextResponse.json(
            { error: "Meal name and at least one ingredient required" },
            { status: 400 }
        )
    }

    try {
        // Process each ingredient - find or create the FoodItem                              
        const processedIngredients = await Promise.all(
            ingredients.map(async (ing) => {
                // Try to find existing food item (case-insensitive)                              
                let foodItem = await prisma.foodItem.findFirst({
                    where: {
                        name: {
                            equals: ing.foodName,
                            mode: "insensitive",
                        },
                    },
                })

                // If not found, create it                                                        
                if (!foodItem) {
                    foodItem = await prisma.foodItem.create({
                        data: {
                            name: ing.foodName,
                            category: ing.category || "Other",
                            defaultUnit: ing.unit,
                        },
                    })
                }

                return {
                    foodItemId: foodItem.id,
                    quantity: ing.quantity,
                    unit: ing.unit,
                }
            })
        )

        // Create the meal with all ingredients                                               
        const meal = await prisma.meal.create({
            data: {
                userId: session.user.id,
                name,
                description,
                servings,
                prepTime,
                cuisine,
                steps,
                ingredients: {
                    create: processedIngredients,
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

        const embedding = await generateEmbedding(name + " " + (description || ""))

        await prisma.$executeRaw`                                                                          
            UPDATE meals                                                                                   
            SET embedding = ${embedding}::vector                                                           
            WHERE id = ${meal.id}                                                                          
            `

        return NextResponse.json({
            success: true,
            meal: {
                id: meal.id,
                name: meal.name,
                servings: meal.servings,
                cuisine: meal.cuisine,
                ingredientCount: meal.ingredients.length,
            },
        })
    } catch (error) {
        console.error("Error creating meal:", error)
        return NextResponse.json(
            { error: "Failed to create meal" },
            { status: 500 }
        )
    }
} 