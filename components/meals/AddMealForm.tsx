"use client"

import { useState } from "react"

type FoodItem = {
    id: string
    name: string
    defaultUnit: string
}

type Props = {
    foodItems: FoodItem[]
}

type IngredientRow = {
    foodItemId: string
    quantity: string
    unit: string
}

export default function AddMealForm({ foodItems }: Props) {
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [servings, setServings] = useState("4")
    const [prepTime, setPrepTime] = useState("")
    const [cuisine, setCuisine] = useState("")
    const [ingredients, setIngredients] = useState<IngredientRow[]>([
        { foodItemId: "", quantity: "", unit: "" }
    ])

    const addIngredientRow = () => {
        setIngredients([...ingredients, {
            foodItemId: "", quantity: "", unit:
                ""
        }])
    }

    const updateIngredient = (index: number, field: keyof IngredientRow,
        value: string) => {
        const updated = [...ingredients]
        updated[index][field] = value

        if (field === "foodItemId") {
            const food = foodItems.find(f => f.id === value)
            if (food) updated[index].unit = food.defaultUnit
        }

        setIngredients(updated)
    }

    const removeIngredientRow = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const response = await fetch("/api/meals", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name, description, servings, prepTime,
                cuisine, ingredients
            }),
        })

        if (response.ok) {
            setName("")
            setDescription("")
            setServings("4")
            setPrepTime("")
            setCuisine("")
            setIngredients([{ foodItemId: "", quantity: "", unit: "" }])
            window.location.reload()
        } else {
            const error = await response.json()
            alert(error.error || "Failed to create meal")
        }
    }

    const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow - sm focus: outline - none focus: ring - 2 focus: ring - blue - 500 focus: border - blue - 500"                                                       

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Meal Details */}
            <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">Meal
                    Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium          
  text-gray-700 mb-1">
                            Meal Name *
                        </label>
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
                        <label className="block text-sm font-medium          
  text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            placeholder="Brief description of the dish..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium          
  text-gray-700 mb-1">
                            Servings *
                        </label>
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
                        <label className="block text-sm font-medium          
  text-gray-700 mb-1">
                            Prep Time (mins)
                        </label>
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
                        <label className="block text-sm font-medium          
  text-gray-700 mb-1">
                            Cuisine
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., Italian, Mexican, American"
                            value={cuisine}
                            onChange={(e) => setCuisine(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                </div>
            </div>

            {/* Ingredients */}
            <div>
                <h3 className="text-md font-medium text-gray-900             
  mb-3">Ingredients</h3>
                <div className="space-y-3">
                    {ingredients.map((ingredient, index) => (
                        <div key={index} className="flex gap-2 items-start">
                            <select
                                value={ingredient.foodItemId}
                                onChange={(e) => updateIngredient(index,
                                    "foodItemId", e.target.value)}
                                required
                                className="flex-1 px-3 py-2 border           
  border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2         
  focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select food...</option>
                                {foodItems.map((food) => (
                                    <option key={food.id}
                                        value={food.id}>{food.name}</option>
                                ))}
                            </select>

                            <input
                                type="number"
                                placeholder="Qty"
                                value={ingredient.quantity}
                                onChange={(e) => updateIngredient(index,
                                    "quantity", e.target.value)}
                                step="0.1"
                                min="0"
                                required
                                className="w-20 px-3 py-2 border             
  border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2         
  focus:ring-blue-500 focus:border-blue-500"
                            />

                            <input
                                type="text"
                                placeholder="Unit"
                                value={ingredient.unit}
                                onChange={(e) => updateIngredient(index,
                                    "unit", e.target.value)}
                                required
                                className="w-20 px-3 py-2 border             
  border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2         
  focus:ring-blue-500 focus:border-blue-500"
                            />

                            <button
                                type="button"
                                onClick={() => removeIngredientRow(index)}
                                className="px-3 py-2 text-red-600            
  hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={addIngredientRow}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-800
   font-medium"
                >
                    + Add Ingredient
                </button>
            </div>

            {/* Submit */}
            <button
                type="submit"
                className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white 
  font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2     
  focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
                Create Meal
            </button>
        </form>
    )
}