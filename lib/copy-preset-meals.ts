import { prisma } from "./prisma"

export async function copyPresetMealsToUser(userId: string) {
    const presets = await prisma.meal.findMany({
        where: { isPreset: true, userId: null },
        include: { ingredients: true },
    })

    for (const preset of presets) {
        const copy = await prisma.meal.create({
            data: {
                userId,
                name: preset.name,
                description: preset.description,
                servings: preset.servings,
                prepTime: preset.prepTime,
                cuisine: preset.cuisine,
                steps: preset.steps,
                isPreset: false,
                hidden: false,
                ingredients: {
                    create: preset.ingredients.map((ing) => ({
                        foodItemId: ing.foodItemId,
                        quantity: ing.quantity,
                        unit: ing.unit,
                    })),
                },
            },
        })

        // Copy embedding if the preset has one
        try {
            await prisma.$executeRaw`
                UPDATE meals
                SET embedding = (SELECT embedding FROM meals WHERE id = ${preset.id})
                WHERE id = ${copy.id}
            `
        } catch {
            // Non-fatal — meal is still usable via fuzzy search
        }
    }
}
