"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

type FoodItem = { id: string; name: string; defaultUnit: string }
type Ingredient = { foodItemId: string; quantity: string; unit: string }
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
    onClose: () => void
}

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
const labelClass = "block text-sm font-medium text-gray-900 mb-1"

export default function EditMealModal({ meal, foodItems, onClose }: Props) {
    const router = useRouter()
    const [name, setName] = useState(meal.name)
    const [description, setDescription] = useState(meal.description ?? "")
    const [servings, setServings] = useState(String(meal.servings))
    const [prepTime, setPrepTime] = useState(meal.prepTime ? String(meal.prepTime) : "")
    const [cuisine, setCuisine] = useState(meal.cuisine ?? "")
    const [steps, setSteps] = useState<string[]>(meal.steps.length ? meal.steps : [""])
    const [ingredients, setIngredients] = useState<Ingredient[]>(
        meal.ingredients.map((i) => ({ foodItemId: i.foodItemId, quantity: String(i.quantity), unit: i.unit }))
    )
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    // Close on Escape
    useEffect(() => {
        function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose() }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [onClose])

    function updateIngredient(index: number, field: keyof Ingredient, value: string) {
        const updated = [...ingredients]
        updated[index][field] = value
        if (field === "foodItemId") {
            const food = foodItems.find((f) => f.id === value)
            if (food) updated[index].unit = food.defaultUnit
        }
        setIngredients(updated)
    }

    function updateStep(index: number, value: string) {
        const updated = [...steps]
        updated[index] = value
        setSteps(updated)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setError("")
        const res = await fetch(`/api/meals/${meal.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name, description, servings, prepTime, cuisine,
                steps: steps.filter((s) => s.trim()),
                ingredients,
            }),
        })
        setSaving(false)
        if (res.ok) {
            router.refresh()
            onClose()
        } else {
            const data = await res.json()
            setError(data.error ?? "Failed to save")
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Edit Meal</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
                    {/* Basic info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className={labelClass}>Meal Name *</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClass}>Description</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Servings *</label>
                            <input type="number" value={servings} onChange={(e) => setServings(e.target.value)} min="1" required className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Prep Time (mins)</label>
                            <input type="number" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} min="0" className={inputClass} />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClass}>Cuisine</label>
                            <input type="text" value={cuisine} onChange={(e) => setCuisine(e.target.value)} className={inputClass} />
                        </div>
                    </div>

                    {/* Ingredients */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Ingredients</h3>
                        <div className="space-y-2">
                            {ingredients.map((ing, i) => (
                                <div key={i} className="flex gap-2 items-center">
                                    <select
                                        value={ing.foodItemId}
                                        onChange={(e) => updateIngredient(i, "foodItemId", e.target.value)}
                                        required
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select food...</option>
                                        {foodItems.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                                    </select>
                                    <input
                                        type="number" placeholder="Qty" step="0.1" min="0" required
                                        value={ing.quantity}
                                        onChange={(e) => updateIngredient(i, "quantity", e.target.value)}
                                        className="w-20 px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                        type="text" placeholder="Unit" required
                                        value={ing.unit}
                                        onChange={(e) => updateIngredient(i, "unit", e.target.value)}
                                        className="w-20 px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIngredients(ingredients.filter((_, j) => j !== i))}
                                        className="text-red-500 hover:text-red-700 px-1"
                                    >✕</button>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setIngredients([...ingredients, { foodItemId: "", quantity: "", unit: "" }])}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >+ Add Ingredient</button>
                    </div>

                    {/* Steps */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Cooking Steps</h3>
                        <div className="space-y-2">
                            {steps.map((step, i) => (
                                <div key={i} className="flex gap-2 items-start">
                                    <span className="mt-2.5 text-xs font-medium text-gray-400 w-5 flex-shrink-0">{i + 1}.</span>
                                    <textarea
                                        value={step}
                                        onChange={(e) => updateStep(i, e.target.value)}
                                        rows={2}
                                        placeholder={`Step ${i + 1}...`}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setSteps(steps.filter((_, j) => j !== i))}
                                        className="mt-2 text-red-500 hover:text-red-700 px-1"
                                    >✕</button>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setSteps([...steps, ""])}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >+ Add Step</button>
                    </div>

                    {error && <p className="text-red-600 text-sm">{error}</p>}
                </form>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit as any}
                        disabled={saving}
                        className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    )
}
