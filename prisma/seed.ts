import { PrismaClient } from '@prisma/client';
import { generateEmbedding } from '../lib/embeddings';

const prisma = new PrismaClient();

async function createMealWithEmbedding(data: any) {
  const meal = await prisma.meal.create(data);

  try {
    const embedding = await generateEmbedding(meal.name + " " + (meal.description || ""));
    await prisma.$executeRaw`
            UPDATE meals
            SET embedding = ${embedding}::vector
            WHERE id = ${meal.id}
        `;
  } catch (e) {
    console.log(`  ⚠ Embedding skipped for ${meal.name} (non-fatal)`);
  }

  return meal;
}

async function seedMealIfMissing(name: string, data: any) {
  const existing = await prisma.meal.findFirst({ where: { name } });
  if (!existing) {
    await createMealWithEmbedding(data);
    console.log(`  ✓ ${name}`);
  } else {
    console.log(`  - ${name} (already exists)`);
  }
}

async function main() {
  console.log('🌱 Seeding database...');

  // Backfill: mark any existing public/unowned meals as presets
  await prisma.meal.updateMany({
    where: { isPublic: true, userId: null },
    data: { isPreset: true },
  });

  // Seed common food items
  const foodItems = [
    { name: 'Chicken Breast', category: 'Protein', defaultUnit: 'lb' },
    { name: 'Ground Beef', category: 'Protein', defaultUnit: 'lb' },
    { name: 'Salmon', category: 'Protein', defaultUnit: 'lb' },
    { name: 'Eggs', category: 'Protein', defaultUnit: 'dozen' },
    { name: 'Onion', category: 'Vegetable', defaultUnit: 'whole' },
    { name: 'Garlic', category: 'Vegetable', defaultUnit: 'clove' },
    { name: 'Tomato', category: 'Vegetable', defaultUnit: 'whole' },
    { name: 'Bell Pepper', category: 'Vegetable', defaultUnit: 'whole' },
    { name: 'Lettuce', category: 'Vegetable', defaultUnit: 'head' },
    { name: 'Carrot', category: 'Vegetable', defaultUnit: 'whole' },
    { name: 'Broccoli', category: 'Vegetable', defaultUnit: 'head' },
    { name: 'Zucchini', category: 'Vegetable', defaultUnit: 'whole' },
    { name: 'Rice', category: 'Grain', defaultUnit: 'cup' },
    { name: 'Pasta', category: 'Grain', defaultUnit: 'lb' },
    { name: 'Bread', category: 'Grain', defaultUnit: 'loaf' },
    { name: 'Flour', category: 'Grain', defaultUnit: 'cup' },
    { name: 'Olive Oil', category: 'Oil', defaultUnit: 'tbsp' },
    { name: 'Vegetable Oil', category: 'Oil', defaultUnit: 'tbsp' },
    { name: 'Butter', category: 'Dairy', defaultUnit: 'tbsp' },
    { name: 'Milk', category: 'Dairy', defaultUnit: 'cup' },
    { name: 'Cheese', category: 'Dairy', defaultUnit: 'cup' },
    { name: 'Yogurt', category: 'Dairy', defaultUnit: 'cup' },
    { name: 'Salt', category: 'Seasoning', defaultUnit: 'tsp' },
    { name: 'Pepper', category: 'Seasoning', defaultUnit: 'tsp' },
    { name: 'Cumin', category: 'Seasoning', defaultUnit: 'tsp' },
    { name: 'Paprika', category: 'Seasoning', defaultUnit: 'tsp' },
    { name: 'Oregano', category: 'Seasoning', defaultUnit: 'tsp' },
    { name: 'Soy Sauce', category: 'Seasoning', defaultUnit: 'tbsp' },
    { name: 'Lemon', category: 'Produce', defaultUnit: 'whole' },
    { name: 'Chicken Broth', category: 'Other', defaultUnit: 'cup' },
  ];

  for (const item of foodItems) {
    await prisma.foodItem.upsert({
      where: { name: item.name },
      update: {},
      create: item,
    });
  }

  console.log('✅ Food items seeded');

  // Create a test user
  await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
    },
  });

  console.log('✅ Test user created');

  // Get food items for recipes
  const chickenBreast = await prisma.foodItem.findUnique({ where: { name: 'Chicken Breast' } });
  const onion = await prisma.foodItem.findUnique({ where: { name: 'Onion' } });
  const garlic = await prisma.foodItem.findUnique({ where: { name: 'Garlic' } });
  const rice = await prisma.foodItem.findUnique({ where: { name: 'Rice' } });
  const groundBeef = await prisma.foodItem.findUnique({ where: { name: 'Ground Beef' } });
  const pasta = await prisma.foodItem.findUnique({ where: { name: 'Pasta' } });
  const tomato = await prisma.foodItem.findUnique({ where: { name: 'Tomato' } });
  const cheese = await prisma.foodItem.findUnique({ where: { name: 'Cheese' } });
  const salmon = await prisma.foodItem.findUnique({ where: { name: 'Salmon' } });
  const broccoli = await prisma.foodItem.findUnique({ where: { name: 'Broccoli' } });
  const bellPepper = await prisma.foodItem.findUnique({ where: { name: 'Bell Pepper' } });
  const soysauce = await prisma.foodItem.findUnique({ where: { name: 'Soy Sauce' } });
  const lemon = await prisma.foodItem.findUnique({ where: { name: 'Lemon' } });
  const oliveOil = await prisma.foodItem.findUnique({ where: { name: 'Olive Oil' } });
  const chickenBroth = await prisma.foodItem.findUnique({ where: { name: 'Chicken Broth' } });
  const carrot = await prisma.foodItem.findUnique({ where: { name: 'Carrot' } });

  console.log('🍽️  Seeding starter meals...');

  if (chickenBreast && onion && garlic && rice) {
    await seedMealIfMissing('Grilled Chicken with Rice', {
      data: {
        name: 'Grilled Chicken with Rice',
        description: 'Simple grilled chicken breast with garlic rice',
        servings: 4,
        prepTime: 30,
        cuisine: 'American',
        isPreset: true,
        steps: [
          'Season chicken breasts on both sides with salt, pepper, and paprika.',
          'Heat a grill pan or skillet over medium-high heat and add a drizzle of oil.',
          'Cook chicken for 6-7 minutes per side until internal temperature reaches 165°F.',
          'Remove chicken from heat and let it rest for 5 minutes.',
          'Meanwhile, rinse rice and cook with 4 cups water and a pinch of salt until absorbed, about 18 minutes.',
          'Mince garlic and sauté in butter for 1 minute, then stir into cooked rice.',
          'Slice chicken and serve over the garlic rice.',
        ],
        ingredients: {
          create: [
            { foodItemId: chickenBreast.id, quantity: 1.5, unit: 'lb' },
            { foodItemId: onion.id, quantity: 1, unit: 'whole' },
            { foodItemId: garlic.id, quantity: 3, unit: 'clove' },
            { foodItemId: rice.id, quantity: 2, unit: 'cup' },
          ],
        },
      },
    });
  }

  if (groundBeef && pasta && tomato && garlic && onion) {
    await seedMealIfMissing('Spaghetti Bolognese', {
      data: {
        name: 'Spaghetti Bolognese',
        description: 'Classic Italian pasta with meat sauce',
        servings: 4,
        prepTime: 45,
        cuisine: 'Italian',
        isPreset: true,
        steps: [
          'Bring a large pot of salted water to a boil.',
          'Dice onion and mince garlic. Chop tomatoes.',
          'Brown ground beef in a large skillet over medium-high heat, breaking it apart. Drain excess fat.',
          'Add onion and garlic to the beef and cook for 3-4 minutes until softened.',
          'Stir in chopped tomatoes, salt, pepper, and oregano. Simmer for 20 minutes.',
          'Cook pasta according to package instructions until al dente. Drain.',
          'Serve sauce over pasta and top with grated cheese.',
        ],
        ingredients: {
          create: [
            { foodItemId: groundBeef.id, quantity: 1, unit: 'lb' },
            { foodItemId: pasta.id, quantity: 1, unit: 'lb' },
            { foodItemId: tomato.id, quantity: 4, unit: 'whole' },
            { foodItemId: garlic.id, quantity: 4, unit: 'clove' },
            { foodItemId: onion.id, quantity: 1, unit: 'whole' },
          ],
        },
      },
    });
  }

  if (groundBeef && onion && cheese) {
    await seedMealIfMissing('Classic Tacos', {
      data: {
        name: 'Classic Tacos',
        description: 'Ground beef tacos with all the fixings',
        servings: 4,
        prepTime: 20,
        cuisine: 'Mexican',
        isPreset: true,
        steps: [
          'Dice onion finely.',
          'Brown ground beef in a skillet over medium-high heat, breaking it apart as it cooks.',
          'Add diced onion and cook for 2-3 minutes until softened.',
          'Season with cumin, chili powder, salt, and pepper. Stir well.',
          'Add a splash of water and simmer for 3 minutes until the sauce thickens slightly.',
          'Warm taco shells or tortillas in the oven at 350°F for 5 minutes.',
          'Assemble tacos with beef mixture, shredded cheese, and your favorite toppings.',
        ],
        ingredients: {
          create: [
            { foodItemId: groundBeef.id, quantity: 1, unit: 'lb' },
            { foodItemId: onion.id, quantity: 1, unit: 'whole' },
            { foodItemId: cheese.id, quantity: 1, unit: 'cup' },
          ],
        },
      },
    });
  }

  if (salmon && lemon && garlic && oliveOil && broccoli) {
    await seedMealIfMissing('Lemon Garlic Salmon', {
      data: {
        name: 'Lemon Garlic Salmon',
        description: 'Baked salmon with lemon and garlic, served with roasted broccoli',
        servings: 4,
        prepTime: 25,
        cuisine: 'American',
        isPreset: true,
        steps: [
          'Preheat oven to 400°F. Line a baking sheet with foil.',
          'Cut broccoli into florets and toss with olive oil, salt, and pepper. Spread on one side of the baking sheet.',
          'Place salmon fillets on the other side. Drizzle with olive oil.',
          'Mince garlic and press it onto the salmon. Squeeze half a lemon over the fillets.',
          'Season salmon with salt and pepper.',
          'Roast for 15-18 minutes until salmon flakes easily and broccoli is tender.',
          'Serve with remaining lemon wedges on the side.',
        ],
        ingredients: {
          create: [
            { foodItemId: salmon.id, quantity: 1.5, unit: 'lb' },
            { foodItemId: lemon.id, quantity: 1, unit: 'whole' },
            { foodItemId: garlic.id, quantity: 3, unit: 'clove' },
            { foodItemId: oliveOil.id, quantity: 2, unit: 'tbsp' },
            { foodItemId: broccoli.id, quantity: 1, unit: 'head' },
          ],
        },
      },
    });
  }

  if (chickenBreast && bellPepper && onion && soysauce && rice) {
    await seedMealIfMissing('Chicken Stir Fry', {
      data: {
        name: 'Chicken Stir Fry',
        description: 'Quick chicken and vegetable stir fry with soy sauce over rice',
        servings: 4,
        prepTime: 25,
        cuisine: 'Asian',
        isPreset: true,
        steps: [
          'Cook rice according to package instructions.',
          'Slice chicken breast into thin strips. Slice bell peppers and onion.',
          'Heat oil in a large wok or skillet over high heat until smoking.',
          'Add chicken and stir fry for 4-5 minutes until cooked through. Remove and set aside.',
          'Add onion and bell pepper to the pan and stir fry for 3 minutes.',
          'Return chicken to the pan and add soy sauce and a pinch of pepper.',
          'Toss everything together for 1 minute and serve over rice.',
        ],
        ingredients: {
          create: [
            { foodItemId: chickenBreast.id, quantity: 1.5, unit: 'lb' },
            { foodItemId: bellPepper.id, quantity: 2, unit: 'whole' },
            { foodItemId: onion.id, quantity: 1, unit: 'whole' },
            { foodItemId: soysauce.id, quantity: 3, unit: 'tbsp' },
            { foodItemId: rice.id, quantity: 2, unit: 'cup' },
          ],
        },
      },
    });
  }

  if (chickenBreast && carrot && onion && garlic && chickenBroth) {
    await seedMealIfMissing('Simple Chicken Soup', {
      data: {
        name: 'Simple Chicken Soup',
        description: 'Comforting one-pot chicken soup with vegetables',
        servings: 6,
        prepTime: 40,
        cuisine: 'American',
        isPreset: true,
        steps: [
          'Dice onion and carrots. Mince garlic.',
          'Heat olive oil in a large pot over medium heat.',
          'Sauté onion and carrots for 4-5 minutes until softened. Add garlic and cook 1 minute more.',
          'Add chicken breasts whole, pour in chicken broth, and bring to a boil.',
          'Reduce heat and simmer for 20 minutes until chicken is cooked through.',
          'Remove chicken, shred it with two forks, and return to the pot.',
          'Season with salt and pepper. Serve hot.',
        ],
        ingredients: {
          create: [
            { foodItemId: chickenBreast.id, quantity: 1.5, unit: 'lb' },
            { foodItemId: carrot.id, quantity: 3, unit: 'whole' },
            { foodItemId: onion.id, quantity: 1, unit: 'whole' },
            { foodItemId: garlic.id, quantity: 4, unit: 'clove' },
            { foodItemId: chickenBroth.id, quantity: 6, unit: 'cup' },
          ],
        },
      },
    });
  }

  console.log('✅ Sample meals seeded');
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
