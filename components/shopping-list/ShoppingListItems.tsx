"use client"

import { useState, useEffect } from "react"

type ShoppingItem = {
    name: string
    toBuy: number | null
    unit: string | null
    inStock?: number
    quantity?: number
}

type Props = {
    items: ShoppingItem[]
    weekKey: string
}

export default function ShoppingListItems({ items, weekKey }: Props) {
    const storageKey = `shopping-checked-${weekKey}`
    const [checked, setChecked] = useState<Set<string>>(new Set())

    useEffect(() => {
        try {
            const stored = localStorage.getItem(storageKey)
            if (stored) {
                setChecked(new Set(JSON.parse(stored)))
            }
        } catch {
            // ignore parse errors
        }
    }, [storageKey])

    function toggle(name: string) {
        setChecked((prev) => {
            const next = new Set(prev)
            if (next.has(name)) {
                next.delete(name)
            } else {
                next.add(name)
            }
            try {
                localStorage.setItem(storageKey, JSON.stringify(Array.from(next)))
            } catch {
                // ignore storage errors
            }
            return next
        })
    }

    return (
        <ul className="divide-y divide-gray-200">
            {items.map((item) => {
                const isChecked = checked.has(item.name)
                return (
                    <li
                        key={item.name}
                        className={`p-4 flex justify-between items-center hover:bg-gray-50 cursor-pointer ${isChecked ? "opacity-50" : ""}`}
                        onClick={() => toggle(item.name)}
                    >
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggle(item.name)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className={`font-medium text-gray-900 ${isChecked ? "line-through" : ""}`}>
                                {item.name}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="font-semibold text-gray-900">
                                {item.toBuy} {item.unit}
                            </span>
                            {item.inStock !== undefined && (
                                <span className="block text-sm text-gray-700">
                                    need {item.quantity}, have {item.inStock}
                                </span>
                            )}
                        </div>
                    </li>
                )
            })}
        </ul>
    )
}
