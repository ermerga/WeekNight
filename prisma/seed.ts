import { PrismaClient } from '@prisma/client';
import { generateEmbedding } from '../lib/embeddings';

const prisma = new PrismaClient();

async function createMealWithEmbedding(data: any) {
  const meal = await prisma.meal.create(data);

  // Generate and store embedding                                                                
  const embedding = await generateEmbedding(meal.name + " " + (meal.description || ""));
  await prisma.$executeRaw`                                                                      
          UPDATE meals                                                                               
          SET embedding = ${embedding}::vector                                                       
          WHERE id = ${meal.id}                                                                      
      `;

  return meal;
}

async function main() {
  console.log('🌱 Seeding database...');

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
  const testUser = await prisma.user.upsert({
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

  // Create sample meals
  if (chickenBreast && onion && garlic && rice) {
    await createMealWithEmbedding({
      data: {
        name: 'Grilled Chicken with Rice',
        description: 'Simple grilled chicken breast with garlic rice',
        servings: 4,
        prepTime: 30,
        cuisine: 'American',
        isPublic: true,
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
    await createMealWithEmbedding({
      data: {
        name: 'Spaghetti Bolognese',
        description: 'Classic Italian pasta with meat sauce',
        servings: 4,
        prepTime: 45,
        cuisine: 'Italian',
        isPublic: true,
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
    await createMealWithEmbedding({
      data: {
        name: 'Classic Tacos',
        description: 'Ground beef tacos with all the fixings',
        servings: 4,
        prepTime: 20,
        cuisine: 'Mexican',
        isPublic: true,
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

  console.log('✅ Sample meals created');
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