"use client"

import { useState } from "react";

type FoodItem = {
    id: string
    name: string
    defaultUnit: string
}

type Props = {
    foodItems: FoodItem[]
}

export default function AddInventoryForm({ foodItems }: Props) {
    const [foodItemId, setFoodItemId] = useState("")
    const [quantity, setQuantity] = useState("")
    const [unit, setUnit] = useState("")
    const [location, setLocation] = useState("pantry")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const response = await fetch("/api/inventory", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ foodItemId, quantity, unit, location }),
        })

        if (response.ok) {
            setFoodItemId("")
            setQuantity("")
            setUnit("")
            setLocation("pantry")
            window.location.reload()
        } else {
            const error = await response.json()
            alert(error.error || "Failed to add item")
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Food Item Select */}
                <div>
                    <label className="block text-sm font-medium text-gray-700
   mb-1">
                        Food Item
                    </label>
                    <select
                        value={foodItemId}
                        onChange={(e) => {
                            setFoodItemId(e.target.value)
                            const food = foodItems.find(f => f.id ===
                                e.target.value)
                            if (food) setUnit(food.defaultUnit)
                        }}
                        required
                        className="w-full px-3 py-2 border border-gray-300   
  rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500     
  focus:border-blue-500"
                    >
                        <option value="">Select a food...</option>
                        {foodItems.map((food) => (
                            <option key={food.id} value={food.id}>
                                {food.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Location Select */}
                <div>
                    <label className="block text-sm font-medium text-gray-700
   mb-1">
                        Location
                    </label>
                    <select
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300   
  rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500     
  focus:border-blue-500"
                    >
                        <option value="pantry">Pantry</option>
                        <option value="fridge">Fridge</option>
                        <option value="freezer">Freezer</option>
                    </select>
                </div>

                {/* Quantity Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700
   mb-1">
                        Quantity
                    </label>
                    <input
                        type="number"
                        placeholder="0"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        step="0.1"
                        min="0"
                        required
                        className="w-full px-3 py-2 border border-gray-300   
  rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500     
  focus:border-blue-500"
                    />
                </div>

                {/* Unit Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700
   mb-1">
                        Unit
                    </label>
                    <input
                        type="text"
                        placeholder="lb, cups, oz..."
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300   
  rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500     
  focus:border-blue-500"
                    />
                </div>
            </div>

            <button
                type="submit"
                className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white 
  font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2     
  focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
                Add Item
            </button>
        </form>
    )
}