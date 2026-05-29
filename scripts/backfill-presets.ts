import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany({ select: { id: true, email: true } })
    const presets = await prisma.meal.findMany({
        where: { isPreset: true, userId: null },
        include: { ingredients: true },
    })

    console.log(`Found ${presets.length} preset meals`)
    console.log(`Found ${users.length} users`)

    for (const user of users) {
        console.log(`\nBackfilling presets for ${user.email}...`)

        for (const preset of presets) {
            const alreadyHasCopy = await prisma.meal.findFirst({
                where: { userId: user.id, name: preset.name },
            })

            if (alreadyHasCopy) {
                console.log(`  - ${preset.name} (already has copy)`)
                continue
            }

            const copy = await prisma.meal.create({
                data: {
                    userId: user.id,
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

            // Copy embedding if preset has one
            try {
                await prisma.$executeRaw`
                    UPDATE meals SET embedding = (SELECT embedding FROM meals WHERE id = ${preset.id})
                    WHERE id = ${copy.id}
                `
            } catch {
                // non-fatal
            }

            console.log(`  ✓ ${preset.name}`)
        }
    }

    console.log("\n✅ Backfill complete")
}

main().catch(console.error).finally(() => prisma.$disconnect())
