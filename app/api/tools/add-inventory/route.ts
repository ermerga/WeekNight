import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

type AddInventoryInput = {
    foodName: string
    quantity: number
    unit: string
    location?: "pantry" | "fridge" | "freezer"
    expiresAt?: string  // ISO date string                                     
}

export async function POST(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: AddInventoryInput = await request.json()
    const { foodName, quantity, unit, location = "pantry", expiresAt } = body

    if (!foodName || !quantity || !unit) {
        return NextResponse.json(
            { error: "foodName, quantity, and unit are required" },
            { status: 400 }
        )
    }

    try {
        // Find or create the food item                                          
        let foodItem = await prisma.foodItem.findFirst({
            where: {
                name: {
                    equals: foodName,
                    mode: "insensitive",
                },
            },
        })

        if (!foodItem) {
            foodItem = await prisma.foodItem.create({
                data: {
                    name: foodName,
                    category: "Other",
                    defaultUnit: unit,
                },
            })
        }

        // Create the inventory item                                             
        const inventoryItem = await prisma.inventoryItem.create({
            data: {
                userId: session.user.id,
                foodItemId: foodItem.id,
                quantity,
                unit,
                location,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
            },
            include: {
                foodItem: true,
            },
        })

        return NextResponse.json({
            success: true,
            item: {
                id: inventoryItem.id,
                name: inventoryItem.foodItem.name,
                quantity: inventoryItem.quantity,
                unit: inventoryItem.unit,
                location: inventoryItem.location,
            },
        })
    } catch (error) {
        console.error("Error adding to inventory:", error)
        return NextResponse.json(
            { error: "Failed to add to inventory" },
            { status: 500 }
        )
    }
}