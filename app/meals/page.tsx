import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import AddMealForm from "@/components/meals/AddMealForm"

export default async function MealsPage() {
    const session = await auth()

    if (!session) {
        redirect("/api/auth/signin")
    }

    const meals = await prisma.meal.findMany({
        where: {
            OR: [
                { userId: session.user?.id },
                { isPublic: true },
            ],
        },
        include: {
            ingredients: {
                include: {
                    foodItem: true,
                },
            },
        },
        orderBy: { name: "asc" },
    })

    const foodItems = await prisma.foodItem.findMany({
        orderBy: { name: "asc" }
    })

    return (
        <main className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Meals</h1>
                <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 
  rounded-full">
                    {meals.length} recipes
                </span>
            </div>

            {/* Meals Grid */}
            {meals.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center   
  mb-8">
                    <p className="text-gray-500">No meals yet. Add your first
                        recipe below!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {meals.map((meal) => (
                        <div key={meal.id} className="bg-white rounded-lg    
  shadow hover:shadow-md transition-shadow">
                            <div className="p-4">
                                <h2 className="text-xl font-semibold         
  mb-2">{meal.name}</h2>

                                <div className="flex gap-3 text-sm           
  text-gray-500 mb-3">
                                    {meal.cuisine && (
                                        <span className="bg-gray-100 px-2    
  py-1 rounded">
                                            {meal.cuisine}
                                        </span>
                                    )}
                                    {meal.prepTime && (
                                        <span>{meal.prepTime} mins</span>
                                    )}
                                    <span>{meal.servings} servings</span>
                                </div>

                                {meal.description && (
                                    <p className="text-gray-600 text-sm      
  mb-3">{meal.description}</p>
                                )}

                                <details className="text-sm">
                                    <summary className="cursor-pointer       
  text-blue-600 hover:text-blue-800">
                                        {meal.ingredients.length} ingredients
                                    </summary>
                                    <ul className="mt-2 pl-4 text-gray-600">
                                        {meal.ingredients.map((ing) => (
                                            <li key={ing.id}>
                                                {ing.quantity} {ing.unit}
                                                {ing.foodItem.name}
                                            </li>
                                        ))}
                                    </ul>
                                </details>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Meal Form */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold">Add New Meal</h2>
                </div>
                <div className="p-4">
                    <AddMealForm foodItems={foodItems} />
                </div>
            </div>
        </main>
    )
}