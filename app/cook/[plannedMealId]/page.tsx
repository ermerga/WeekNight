import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import CookingUI from "./CookingUI"

export default async function CookPage({
    params,
}: {
    params: Promise<{ plannedMealId: string }>
}) {
    const session = await auth()
    if (!session?.user?.id) redirect("/signin")

    const { plannedMealId } = await params

    const plannedMeal = await prisma.plannedMeal.findUnique({
        where: { id: plannedMealId },
        include: {
            meal: {
                include: {
                    ingredients: {
                        include: { foodItem: true },
                    },
                },
            },
        },
    })

    if (!plannedMeal) notFound()

    // Verify this planned meal belongs to the current user
    const mealPlan = await prisma.mealPlan.findUnique({
        where: { id: plannedMeal.mealPlanId },
    })
    if (mealPlan?.userId !== session.user.id) notFound()

    return <CookingUI plannedMeal={plannedMeal} />
}
