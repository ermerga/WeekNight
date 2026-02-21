import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import Fuse from "fuse.js"
import { generateEmbedding } from "@/lib/embeddings"

// Helper to get start of week                                               
function getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    d.setDate(d.getDate() - day)
    d.setHours(0, 0, 0, 0)
    return d
}

type AddToPlanInput = {
    mealName: string
    date: string
    mealType?: "breakfast" | "lunch" | "dinner" | "snack"
}

export async function POST(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: AddToPlanInput = await request.json()
    const { mealName, date, mealType = "dinner" } = body

    if (!mealName || !date) {
        return NextResponse.json(
            { error: "mealName and date are required" },
            { status: 400 }
        )
    }

    try {
        // First, try Fuse.js for exact/typo matching                                                      
        const candidateMeals = await prisma.meal.findMany({
            where: {
                OR: [
                    { userId: session.user.id },
                    { isPublic: true }
                ]
            }
        })

        const fuse = new Fuse(candidateMeals, {
            keys: ['name'],
            threshold: 0.4,
            includeScore: true
        })

        const fuseResults = fuse.search(mealName)

        let meal;

        if (fuseResults.length > 0 && fuseResults[0].score! <= 0.4) {
            // Good fuzzy match found                                                                      
            meal = fuseResults[0].item
        } else {
            // Fall back to semantic search with embeddings                                                
            const queryEmbedding = await generateEmbedding(mealName)

            const similarMeals: any[] = await prisma.$queryRaw`                                            
                SELECT id, name, description,                                                              
                        1 - (embedding <=> ${queryEmbedding}::vector) as similarity                         
                FROM meals                                                                                 
                WHERE (user_id = ${session.user.id} OR is_public = true)                                   
                    AND embedding IS NOT NULL                                                                
                ORDER BY embedding <=> ${queryEmbedding}::vector                                           
                LIMIT 1                                                                                    
            `

            if (similarMeals.length === 0 || similarMeals[0].similarity < 0.5) {
                return NextResponse.json({
                    success: false,
                    found: false,
                    mealName: mealName,
                    message: "Meal not found in database"
                })
            }

            meal = similarMeals[0]
        }

        const mealDate = new Date(date + "T00:00:00")
        const weekStart = getWeekStart(mealDate)

        // Find or create meal plan for this week                                
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

        // Create the planned meal                                               
        const plannedMeal = await prisma.plannedMeal.create({
            data: {
                mealPlanId: mealPlan.id,
                mealId: meal.id,
                date: mealDate,
                mealType,
            },
            include: {
                meal: true,
            },
        })

        return NextResponse.json({
            success: true,
            plannedMeal: {
                id: plannedMeal.id,
                mealName: plannedMeal.meal.name,
                date: plannedMeal.date,
                mealType: plannedMeal.mealType,
            },
        })
    } catch (error) {
        console.error("Error adding to plan:", error)
        return NextResponse.json(
            { error: "Failed to add meal to plan" },
            { status: 500 }
        )
    }
}