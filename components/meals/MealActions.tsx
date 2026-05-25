"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import EditMealModal from "./EditMealModal"

type FoodItem = { id: string; name: string; defaultUnit: string }
type Meal = {
    id: string
    name: string
    description: string | null
    servings: number
    prepTime: number | null
    cuisine: string | null
    steps: string[]
    ingredients: { foodItemId: string; quantity: number; unit: string }[]
}

type Props = {
    meal: Meal
    foodItems: FoodItem[]
}

export default function MealActions({ meal, foodItems }: Props) {
    const router = useRouter()
    const [editing, setEditing] = useState(false)
    const [deleting, setDeleting] = useState(false)

    async function handleDelete() {
        if (!confirm(`Delete "${meal.name}"? This will also remove it from any meal plans.`)) return
        setDeleting(true)
        await fetch(`/api/meals/${meal.id}`, { method: "DELETE" })
        setDeleting(false)
        router.refresh()
    }

    return (
        <>
            <div className="flex gap-2 mt-3">
                <button
                    onClick={() => setEditing(true)}
                    className="text-xs px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                    Edit
                </button>
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                    {deleting ? "Deleting..." : "Delete"}
                </button>
            </div>

            {editing && (
                <EditMealModal
                    meal={meal}
                    foodItems={foodItems}
                    onClose={() => setEditing(false)}
                />
            )}
        </>
    )
}
