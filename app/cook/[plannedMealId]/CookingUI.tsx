"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Ingredient = {
    id: string
    quantity: number
    unit: string
    foodItem: { name: string }
}

type Meal = {
    id: string
    name: string
    description: string | null
    servings: number
    prepTime: number | null
    cuisine: string | null
    steps: string[]
    ingredients: Ingredient[]
}

type PlannedMeal = {
    id: string
    mealType: string
    date: Date
    isCompleted: boolean
    meal: Meal
}

export default function CookingUI({ plannedMeal }: { plannedMeal: PlannedMeal }) {
    const { meal } = plannedMeal
    const steps = meal.steps ?? []
    const [currentStep, setCurrentStep] = useState(0)
    const [completed, setCompleted] = useState(plannedMeal.isCompleted)
    const [marking, setMarking] = useState(false)
    const router = useRouter()

    const hasSteps = steps.length > 0
    const isLastStep = currentStep === steps.length - 1

    async function markComplete() {
        setMarking(true)
        await fetch(`/api/planned-meals/${plannedMeal.id}/complete`, { method: "POST" })
        setCompleted(true)
        setMarking(false)
        router.refresh()
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
                <Link href="/planner" className="text-gray-500 hover:text-gray-900 text-sm">
                    ← Back to planner
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-gray-900">{meal.name}</h1>
                    <p className="text-sm text-gray-500 capitalize">
                        {plannedMeal.mealType}
                        {meal.prepTime ? ` · ${meal.prepTime} min` : ""}
                        {meal.cuisine ? ` · ${meal.cuisine}` : ""}
                        {` · Serves ${meal.servings}`}
                    </p>
                </div>
                {completed && (
                    <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                        Cooked ✓
                    </span>
                )}
            </div>

            <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Ingredients sidebar */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <h2 className="font-semibold text-gray-900 mb-4">Ingredients</h2>
                        <ul className="space-y-2">
                            {meal.ingredients.map((ing) => (
                                <li key={ing.id} className="flex justify-between text-sm">
                                    <span className="text-gray-800">{ing.foodItem.name}</span>
                                    <span className="text-gray-500 ml-2 shrink-0">
                                        {ing.quantity} {ing.unit}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Steps main area */}
                <div className="md:col-span-2 flex flex-col gap-4">
                    {!hasSteps ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
                            <p className="mb-2 font-medium">No steps yet for this meal.</p>
                            <p className="text-sm">Ask the AI to recreate this meal and it will include cooking steps.</p>
                        </div>
                    ) : (
                        <>
                            {/* Progress bar */}
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-500 shrink-0">
                                    Step {currentStep + 1} of {steps.length}
                                </span>
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-black rounded-full h-2 transition-all duration-300"
                                        style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Current step */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex-1">
                                <p className="text-2xl text-gray-900 leading-relaxed">
                                    {steps[currentStep]}
                                </p>
                            </div>

                            {/* All steps (small, dimmed) */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">All steps</h3>
                                <ol className="space-y-2">
                                    {steps.map((step, i) => (
                                        <li
                                            key={i}
                                            onClick={() => setCurrentStep(i)}
                                            className={`flex gap-3 text-sm cursor-pointer rounded-lg px-3 py-2 transition-colors ${
                                                i === currentStep
                                                    ? "bg-gray-900 text-white"
                                                    : i < currentStep
                                                    ? "text-gray-400 hover:bg-gray-50"
                                                    : "text-gray-600 hover:bg-gray-50"
                                            }`}
                                        >
                                            <span className="shrink-0 font-medium">{i + 1}.</span>
                                            <span className="truncate">{step}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>

                            {/* Navigation */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                                    disabled={currentStep === 0}
                                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    ← Previous
                                </button>

                                {isLastStep ? (
                                    <button
                                        onClick={markComplete}
                                        disabled={marking || completed}
                                        className="flex-1 py-3 rounded-xl bg-black text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {completed ? "Done ✓" : marking ? "Saving..." : "Mark as cooked ✓"}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))}
                                        className="flex-1 py-3 rounded-xl bg-black text-white font-medium hover:bg-gray-800 transition-colors"
                                    >
                                        Next →
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
