import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const inventory = await prisma.inventoryItem.findMany({
            where: {
                userId: session.user.id,
            },
            include: {
                foodItem: true,
            },
            orderBy: { foodItem: { name: "asc" } },
        })

        return NextResponse.json({
            success: true,
            count: inventory.length,
            items: inventory.map((item) => ({
                id: item.id,
                name: item.foodItem.name,
                quantity: item.quantity,
                unit: item.unit,
                location: item.location,
                expiresAt: item.expiresAt?.toISOString() || null,
            })),
        })
    } catch (error) {
        console.error("Error getting inventory:", error)
        return NextResponse.json(
            { error: "Failed to get inventory" },
            { status: 500 }
        )
    }
}