"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

type FoodItem = { id: string; name: string; defaultUnit: string }
type IngredientRow = { foodItemId: string; quantity: string; unit: string }

type Props = {
    foodItems: FoodItem[]
}

const inputClass = "w-full px-3 py-2 border border-[#E8E5DF] rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] bg-white"
const labelClass = "block text-sm font-medium text-gray-700 mb-1"

export default function AddMealModal({ foodItems }: Props) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [servings, setServings] = useState("4")
    const [prepTime, setPrepTime] = useState("")
    const [cuisine, setCuisine] = useState("")
    const [ingredients, setIngredients] = useState<IngredientRow[]>([
        { foodItemId: "", quantity: "", unit: "" },
    ])
    const [steps, setSteps] = useState<string[]>([""])
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false)
        }
        if (open) window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [open])

    function reset() {
        setName("")
        setDescription("")
        setServings("4")
        setPrepTime("")
        setCuisine("")
        setIngredients([{ foodItemId: "", quantity: "", unit: "" }])
        setSteps([""])
        setError("")
    }

    function close() {
        setOpen(false)
        reset()
    }

    function updateIngredient(index: number, field: keyof IngredientRow, value: string) {
        const updated = [...ingredients]
        updated[index][field] = value
        if (field === "foodItemId") {
            const food = foodItems.find((f) => f.id === value)
            if (food) updated[index].unit = food.defaultUnit
        }
        setIngredients(updated)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setError("")
        const res = await fetch("/api/meals", {
            method: "POST",
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
            close()
        } else {
            const data = await res.json()
            setError(data.error ?? "Failed to create meal")
        }
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2D6A4F] text-white text-sm font-medium rounded-lg hover:bg-[#1B5E40] transition-colors"
            >
                <span className="text-lg leading-none">+</span> Add Meal
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={close} />

                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E5DF]">
                            <h2 className="text-lg font-semibold text-gray-900">Add New Meal</h2>
                            <button onClick={close} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
                            {/* Basic info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className={labelClass}>Meal Name *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Chicken Parmesan"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className={inputClass}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelClass}>Description</label>
                                    <textarea
                                        placeholder="Brief description of the dish..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={2}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Servings *</label>
                                    <input
                                        type="number"
                                        placeholder="4"
                                        value={servings}
                                        onChange={(e) => setServings(e.target.value)}
                                        min="1"
                                        required
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Prep Time (mins)</label>
                                    <input
                                        type="number"
                                        placeholder="30"
                                        value={prepTime}
                                        onChange={(e) => setPrepTime(e.target.value)}
                                        min="0"
                                        className={inputClass}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelClass}>Cuisine</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Italian, Mexican, American"
                                        value={cuisine}
                                        onChange={(e) => setCuisine(e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            {/* Ingredients */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Ingredients</h3>
                                <div className="space-y-2">
                                    {ingredients.map((ing, i) => (
                                        <div key={i} className="flex gap-2 items-center">
                                            <select
                                                value={ing.foodItemId}
                                                onChange={(e) => updateIngredient(i, "foodItemId", e.target.value)}
                                                required
                                                className="flex-1 px-3 py-2 border border-[#E8E5DF] rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] bg-white"
                                            >
                                                <option value="">Select food...</option>
                                                {foodItems.map((f) => (
                                                    <option key={f.id} value={f.id}>{f.name}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="number"
                                                placeholder="Qty"
                                                step="0.1"
                                                min="0"
                                                required
                                                value={ing.quantity}
                                                onChange={(e) => updateIngredient(i, "quantity", e.target.value)}
                                                className="w-20 px-3 py-2 border border-[#E8E5DF] rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Unit"
                                                required
                                                value={ing.unit}
                                                onChange={(e) => updateIngredient(i, "unit", e.target.value)}
                                                className="w-20 px-3 py-2 border border-[#E8E5DF] rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setIngredients(ingredients.filter((_, j) => j !== i))}
                                                className="text-red-400 hover:text-red-600 px-1 text-lg leading-none"
                                            >✕</button>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIngredients([...ingredients, { foodItemId: "", quantity: "", unit: "" }])}
                                    className="mt-3 text-sm text-[#2D6A4F] hover:text-[#1B5E40] font-medium"
                                >
                                    + Add Ingredient
                                </button>
                            </div>

                            {/* Steps */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Cooking Steps</h3>
                                <div className="space-y-2">
                                    {steps.map((step, i) => (
                                        <div key={i} className="flex gap-2 items-start">
                                            <span className="mt-2.5 text-xs font-medium text-gray-400 w-5 flex-shrink-0">{i + 1}.</span>
                                            <textarea
                                                value={step}
                                                onChange={(e) => {
                                                    const updated = [...steps]
                                                    updated[i] = e.target.value
                                                    setSteps(updated)
                                                }}
                                                rows={2}
                                                placeholder={`Step ${i + 1}...`}
                                                className="flex-1 px-3 py-2 border border-[#E8E5DF] rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] resize-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setSteps(steps.filter((_, j) => j !== i))}
                                                className="mt-2 text-red-400 hover:text-red-600 px-1 text-lg leading-none"
                                            >✕</button>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSteps([...steps, ""])}
                                    className="mt-3 text-sm text-[#2D6A4F] hover:text-[#1B5E40] font-medium"
                                >
                                    + Add Step
                                </button>
                            </div>

                            {error && <p className="text-red-600 text-sm">{error}</p>}
                        </form>

                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#E8E5DF]">
                            <button
                                type="button"
                                onClick={close}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit as React.MouseEventHandler}
                                disabled={saving}
                                className="px-5 py-2 bg-[#2D6A4F] text-white text-sm font-medium rounded-lg hover:bg-[#1B5E40] disabled:opacity-50 transition-colors"
                            >
                                {saving ? "Creating..." : "Create Meal"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
