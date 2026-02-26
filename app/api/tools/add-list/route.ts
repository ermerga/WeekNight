import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

type AddShoppingListInput = {
    name: string
    quantity?: number
    unit?: string
    notes?: string
}

function getWeekStart(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0,0,0,0);
    return d; 
}

export async function POST(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: AddShoppingListInput = await request.json()
    const { name, quantity, unit, notes } = body

    if (!name) {
        return NextResponse.json(
            { error: "name is required" },
            { status: 400 }
        )
    }

    try {
        const weekStart = getWeekStart(new Date()); 

        let shoppingList = await prisma.shoppingList.findFirst({
            where: {
                userId: session.user.id,
                weekStartDate: weekStart
            }
        })

        if (!shoppingList) {
            shoppingList = await prisma.shoppingList.create({
                data: {
                    userId: session.user.id,
                    weekStartDate: weekStart
                }
            })
        }
        let updated; 
        let shoppingItem = await prisma.shoppingListItem.findFirst({
            where: {
                shoppingListId: shoppingList.id,
                name: {
                    equals: name,
                    mode: "insensitive"
                }
            }
        })
        if (shoppingItem && quantity) {
            updated = true; 
            shoppingItem = await prisma.shoppingListItem.update({
                where: { id: shoppingItem.id }, 
                data: {
                    quantity: {
                        increment: quantity
                    }
                }
            })
        }
        if (!shoppingItem) {
            updated = false; 
            shoppingItem = await prisma.shoppingListItem.create({
                data: {
                    shoppingListId: shoppingList.id,
                    name,
                    quantity,
                    unit,
                    notes
                    }
            })
        }
        return NextResponse.json({
            success: true, 
            shoppingItem: {
                name: shoppingItem.name,
                updated: updated
            }
        })
    } catch (error) {
        console.error("Error adding to shopping list", error)
        return NextResponse.json(
            { error: "Failed to add item to shopping list" },
            { status: 500 }
        )
    }
}