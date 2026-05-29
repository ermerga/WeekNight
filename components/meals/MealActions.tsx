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
    const [hiding, setHiding] = useState(false)

    async function handleDelete() {
        if (!confirm(`Delete "${meal.name}"? This will also remove it from any meal plans.`)) return
        setDeleting(true)
        await fetch(`/api/meals/${meal.id}`, { method: "DELETE" })
        setDeleting(false)
        router.refresh()
    }

    async function handleHide() {
        setHiding(true)
        await fetch(`/api/meals/${meal.id}/hide`, { method: "PATCH" })
        setHiding(false)
        router.refresh()
    }

    return (
        <>
            <div className="flex gap-2 mt-3">
                <button
                    onClick={() => setEditing(true)}
                    className="text-xs px-3 py-2.5 border border-[#E8E5DF] text-gray-700 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px]"
                >
                    Edit
                </button>
                <button
                    onClick={handleHide}
                    disabled={hiding}
                    className="text-xs px-3 py-2.5 border border-[#E8E5DF] text-gray-500 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 min-h-[44px]"
                >
                    {hiding ? "Hiding..." : "Hide"}
                </button>
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-xs px-3 py-2.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 min-h-[44px]"
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
