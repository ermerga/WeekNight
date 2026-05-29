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
        <div className="min-h-screen bg-[#FAF9F6]">
            {/* Header */}
            <div className="bg-white border-b border-[#E8E5DF] px-6 py-4 flex items-center gap-4">
                <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 flex-shrink-0">
                    ← Back
                </Link>
                <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-bold text-gray-900 truncate">{meal.name}</h1>
                    <p className="text-xs text-gray-500 capitalize">
                        {[
                            plannedMeal.mealType,
                            meal.prepTime ? `${meal.prepTime} min` : null,
                            meal.cuisine,
                            `Serves ${meal.servings}`,
                        ].filter(Boolean).join(" · ")}
                    </p>
                </div>
                {completed && (
                    <span className="flex-shrink-0 text-xs bg-[#EEF5F0] text-[#2D6A4F] px-3 py-1 rounded-full font-medium">
                        Cooked ✓
                    </span>
                )}
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">

                {/* Ingredient chips */}
                {meal.ingredients.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {meal.ingredients.map((ing) => (
                            <span
                                key={ing.id}
                                className="bg-white border border-[#E8E5DF] rounded-full text-xs text-gray-600 px-3 py-1"
                            >
                                {ing.foodItem.name} <span className="text-gray-400">{ing.quantity} {ing.unit}</span>
                            </span>
                        ))}
                    </div>
                )}

                {!hasSteps ? (
                    <div className="bg-white rounded-xl border border-[#E8E5DF] p-10 text-center">
                        <p className="text-gray-500 text-sm mb-1 font-medium">No cooking steps yet.</p>
                        <p className="text-gray-400 text-xs">Ask the AI to recreate this meal and it will include steps.</p>
                    </div>
                ) : (
                    <>
                        {/* Active step — green border accent */}
                        <div className="bg-white rounded-xl border-2 border-[#2D6A4F] p-6">
                            <p className="text-xs font-bold text-[#2D6A4F] uppercase tracking-wider mb-3">
                                Step {currentStep + 1} of {steps.length}
                            </p>
                            <p className="text-gray-900 text-lg leading-relaxed">
                                {steps[currentStep]}
                            </p>
                        </div>

                        {/* Step timeline */}
                        <div className="bg-white rounded-xl border border-[#E8E5DF] overflow-hidden">
                            <div className="px-4 py-3 border-b border-[#E8E5DF]">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">All steps</span>
                            </div>
                            <ol>
                                {steps.map((step, i) => {
                                    const isPast = i < currentStep
                                    const isCurrent = i === currentStep
                                    const isFuture = i > currentStep
                                    return (
                                        <li
                                            key={i}
                                            onClick={() => setCurrentStep(i)}
                                            className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-[#E8E5DF] last:border-b-0 ${
                                                isCurrent ? "bg-[#EEF5F0]" : "hover:bg-gray-50"
                                            } ${isPast ? "opacity-40" : ""}`}
                                        >
                                            <span className={`flex-shrink-0 text-xs font-bold mt-0.5 w-4 ${isCurrent ? "text-[#2D6A4F]" : "text-gray-400"}`}>
                                                {i + 1}.
                                            </span>
                                            <span className={`text-sm leading-relaxed ${
                                                isCurrent ? "text-gray-900 font-medium" :
                                                isPast ? "text-gray-400 line-through" :
                                                "text-gray-600"
                                            }`}>
                                                {step}
                                            </span>
                                        </li>
                                    )
                                })}
                            </ol>
                        </div>

                        {/* Navigation */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                                disabled={currentStep === 0}
                                className="flex-1 py-3 rounded-xl border border-[#E8E5DF] text-gray-700 text-sm font-medium bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                ← Previous
                            </button>

                            {isLastStep ? (
                                <button
                                    onClick={markComplete}
                                    disabled={marking || completed}
                                    className="flex-1 py-3 rounded-xl bg-[#2D6A4F] text-white text-sm font-medium hover:bg-[#1B5E40] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {completed ? "Done ✓" : marking ? "Saving..." : "Mark as cooked ✓"}
                                </button>
                            ) : (
                                <button
                                    onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))}
                                    className="flex-1 py-3 rounded-xl bg-[#2D6A4F] text-white text-sm font-medium hover:bg-[#1B5E40] transition-colors"
                                >
                                    Next →
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
