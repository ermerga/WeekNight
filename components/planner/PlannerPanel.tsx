"use client"

import { useState } from "react"
import Link from "next/link"
import SignOutButton from "@/components/SignOutButton"

type PlannedMealData = {
    id: string
    dateStr: string // "YYYY-MM-DD"
    mealType: string
    isCompleted: boolean
    mealName: string
}

type Props = {
    userName: string
    weekStartStr: string // "YYYY-MM-DD"
    prevWeekUrl: string
    nextWeekUrl: string
    dayStrs: string[] // 7 "YYYY-MM-DD" strings
    plannedMeals: PlannedMealData[]
    totalMeals: number
}

function getTodayStr(): string {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

function formatDayLabel(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00")
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

function formatDayLong(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00")
    return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
}

function formatWeekStart(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00")
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatWeekdayShort(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00")
    return d.toLocaleDateString("en-US", { weekday: "short" })
}

export default function PlannerPanel({
    userName,
    weekStartStr,
    prevWeekUrl,
    nextWeekUrl,
    dayStrs,
    plannedMeals,
    totalMeals,
}: Props) {
    const todayStr = getTodayStr()
    const todayIndex = dayStrs.findIndex(d => d === todayStr)
    const [activeDayIndex, setActiveDayIndex] = useState(todayIndex >= 0 ? todayIndex : 0)
    const [panelOpen, setPanelOpen] = useState(false)

    function getDayMeals(dateStr: string) {
        return plannedMeals.filter(pm => pm.dateStr === dateStr)
    }

    const activeDayStr = dayStrs[activeDayIndex]
    const activeDayMeals = getDayMeals(activeDayStr)
    const isActiveToday = activeDayStr === todayStr

    return (
        <>
            {/* ── Desktop: Warm Cards full week (md+) ── */}
            <div className="hidden md:flex md:flex-col flex-1" style={{ background: "#FAF9F6" }}>
                {/* Header */}
                <div className="px-4 py-3 border-b flex-shrink-0" style={{ borderColor: "#E8E5DF" }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-sm" style={{ color: "#1a1a1a" }}>
                                {userName}&apos;s week
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Link href={prevWeekUrl} className="text-xs transition-opacity hover:opacity-60" style={{ color: "#a89f94" }}>
                                    ← Prev
                                </Link>
                                <span className="text-xs" style={{ color: "#a89f94" }}>·</span>
                                <span className="text-xs" style={{ color: "#8a8179" }}>
                                    {formatWeekStart(weekStartStr)}
                                </span>
                                <span className="text-xs" style={{ color: "#a89f94" }}>·</span>
                                <Link href={nextWeekUrl} className="text-xs transition-opacity hover:opacity-60" style={{ color: "#a89f94" }}>
                                    Next →
                                </Link>
                            </div>
                        </div>
                        <SignOutButton />
                    </div>
                </div>

                {/* Day cards */}
                <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-1.5">
                    {dayStrs.map(dayStr => {
                        const isToday = dayStr === todayStr
                        const dayMeals = getDayMeals(dayStr)
                        return (
                            <div
                                key={dayStr}
                                className="rounded-lg px-2.5 py-2"
                                style={{
                                    background: isToday ? "#F0F6F2" : "#fff",
                                    border: isToday ? "1.5px solid #2D6A4F" : "1.5px solid #E8E5DF",
                                }}
                            >
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#7a7168" }}>
                                        {formatDayLabel(dayStr)}
                                    </span>
                                    {isToday && (
                                        <span
                                            className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded text-white"
                                            style={{ background: "#2D6A4F" }}
                                        >
                                            Today
                                        </span>
                                    )}
                                </div>
                                {dayMeals.length === 0 ? (
                                    <p className="text-xs italic" style={{ color: "#c4bdb5" }}>No meals planned</p>
                                ) : (
                                    <div className="flex flex-col gap-1">
                                        {dayMeals.map(pm => (
                                            <div key={pm.id} className="flex items-center justify-between gap-1.5">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <span
                                                        className="text-[9px] font-semibold uppercase tracking-wider px-1 py-0.5 rounded flex-shrink-0"
                                                        style={{ background: "#E8E5DF", color: "#7a7168" }}
                                                    >
                                                        {pm.mealType}
                                                    </span>
                                                    <span className="text-xs font-medium truncate" style={{ color: "#1a1a1a" }}>
                                                        {pm.mealName}
                                                    </span>
                                                </div>
                                                <Link
                                                    href={`/cook/${pm.id}`}
                                                    className="flex-shrink-0 text-[10px] text-white rounded px-2 py-1 min-h-[26px] flex items-center font-medium hover:opacity-80 transition-opacity"
                                                    style={{ background: "#1a1a1a" }}
                                                >
                                                    {pm.isCompleted ? "✓" : "▶"}
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 px-4 py-3 border-t flex items-center justify-between" style={{ borderColor: "#E8E5DF" }}>
                    <span className="text-xs" style={{ color: "#9a9288" }}>
                        {totalMeals} {totalMeals === 1 ? "meal" : "meals"} planned
                    </span>
                    <Link
                        href="/shopping-list"
                        className="text-xs font-medium px-2.5 py-1 rounded-full transition-opacity hover:opacity-80"
                        style={{ background: "#D1EAD9", color: "#1B5E40" }}
                    >
                        Shopping List →
                    </Link>
                </div>
            </div>

            {/* ── Mobile: collapsed today card (below md) ── */}
            <div
                className="md:hidden flex flex-col"
                style={{ background: "#FAF9F6", height: "196px" }}
            >
                {/* Mobile header */}
                <div
                    className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0"
                    style={{ borderColor: "#F0EDE8" }}
                >
                    <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                        <span className="text-sm font-semibold truncate" style={{ color: "#1a1a1a" }}>
                            {formatDayLong(activeDayStr)}
                        </span>
                        {isActiveToday && (
                            <span
                                className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded text-white flex-shrink-0"
                                style={{ background: "#2D6A4F" }}
                            >
                                Today
                            </span>
                        )}
                        <div className="flex items-center gap-1 flex-shrink-0">
                            {dayStrs.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveDayIndex(i)}
                                    aria-label={`Day ${i + 1}`}
                                    style={{
                                        width: i === activeDayIndex ? "12px" : "5px",
                                        height: "5px",
                                        borderRadius: i === activeDayIndex ? "3px" : "50%",
                                        background: i === activeDayIndex ? "#2D6A4F" : "#D8D4CE",
                                        border: "none",
                                        padding: 0,
                                        cursor: "pointer",
                                        transition: "all .15s",
                                        flexShrink: 0,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={() => setPanelOpen(true)}
                        className="text-[10px] font-semibold px-2.5 py-1.5 rounded-full flex-shrink-0 ml-2"
                        style={{ background: "#E8E5DF", color: "#6b6059" }}
                    >
                        Week ↑
                    </button>
                </div>

                {/* Active day card */}
                <div
                    className="flex-1 mx-3 my-2 rounded-xl px-3 py-2 flex flex-col gap-1.5 overflow-hidden"
                    style={{ background: "#F0F6F2", border: "1.5px solid #2D6A4F" }}
                >
                    {activeDayMeals.length === 0 ? (
                        <p className="text-xs italic" style={{ color: "#c4bdb5" }}>No meals — ask the chat!</p>
                    ) : (
                        activeDayMeals.map(pm => (
                            <div key={pm.id} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span
                                        className="text-[9px] font-semibold uppercase tracking-wider px-1 py-0.5 rounded flex-shrink-0"
                                        style={{ background: "#E8E5DF", color: "#7a7168" }}
                                    >
                                        {pm.mealType}
                                    </span>
                                    <span className="text-xs font-medium truncate" style={{ color: "#1a1a1a" }}>
                                        {pm.mealName}
                                    </span>
                                </div>
                                <Link
                                    href={`/cook/${pm.id}`}
                                    className="flex-shrink-0 text-white text-[11px] font-medium px-3 py-1.5 rounded-md hover:opacity-80 transition-opacity"
                                    style={{ background: "#1a1a1a" }}
                                >
                                    {pm.isCompleted ? "✓" : "Cook"}
                                </Link>
                            </div>
                        ))
                    )}
                </div>

                {/* Day nav bar */}
                <div className="flex items-center justify-between px-4 pb-2 flex-shrink-0">
                    <button
                        onClick={() => setActiveDayIndex(i => Math.max(0, i - 1))}
                        disabled={activeDayIndex === 0}
                        className="text-[11px] disabled:opacity-0 transition-opacity"
                        style={{ color: "#a89f94" }}
                    >
                        {activeDayIndex > 0 ? `← ${formatWeekdayShort(dayStrs[activeDayIndex - 1])}` : ""}
                    </button>
                    <span className="text-[10px]" style={{ color: "#c4bdb5" }}>
                        {totalMeals} meals ·{" "}
                        <Link href="/shopping-list" className="font-medium" style={{ color: "#2D6A4F" }}>
                            Shopping List
                        </Link>
                    </span>
                    <button
                        onClick={() => setActiveDayIndex(i => Math.min(6, i + 1))}
                        disabled={activeDayIndex === 6}
                        className="text-[11px] disabled:opacity-0 transition-opacity"
                        style={{ color: "#a89f94" }}
                    >
                        {activeDayIndex < 6 ? `${formatWeekdayShort(dayStrs[activeDayIndex + 1])} →` : ""}
                    </button>
                </div>
            </div>

            {/* ── Slide-up week panel overlay (mobile only) ── */}
            {panelOpen && (
                <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0"
                        style={{ background: "rgba(0,0,0,0.3)" }}
                        onClick={() => setPanelOpen(false)}
                    />
                    {/* Panel */}
                    <div
                        className="relative flex flex-col overflow-hidden rounded-t-2xl"
                        style={{
                            background: "#FAF9F6",
                            maxHeight: "85vh",
                            boxShadow: "0 -4px 24px rgba(0,0,0,.13)",
                        }}
                    >
                        {/* Drag handle */}
                        <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0">
                            <div className="w-9 h-1 rounded-full" style={{ background: "#d1cec9" }} />
                        </div>
                        {/* Panel header */}
                        <div
                            className="px-4 pb-3 flex items-center justify-between border-b flex-shrink-0"
                            style={{ borderColor: "#E8E5DF" }}
                        >
                            <div>
                                <p className="font-semibold text-sm" style={{ color: "#1a1a1a" }}>
                                    {userName}&apos;s week
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <Link href={prevWeekUrl} className="text-xs" style={{ color: "#a89f94" }}>← Prev</Link>
                                    <span className="text-xs" style={{ color: "#a89f94" }}>·</span>
                                    <span className="text-xs" style={{ color: "#8a8179" }}>{formatWeekStart(weekStartStr)}</span>
                                    <span className="text-xs" style={{ color: "#a89f94" }}>·</span>
                                    <Link href={nextWeekUrl} className="text-xs" style={{ color: "#a89f94" }}>Next →</Link>
                                </div>
                            </div>
                            <button
                                onClick={() => setPanelOpen(false)}
                                className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full"
                                style={{ background: "#E8E5DF", color: "#6b6059" }}
                            >
                                ↓ Close
                            </button>
                        </div>
                        {/* Scrollable day list */}
                        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
                            {dayStrs.map(dayStr => {
                                const isToday = dayStr === todayStr
                                const dayMeals = getDayMeals(dayStr)
                                return (
                                    <div
                                        key={dayStr}
                                        className="rounded-lg px-2.5 py-2"
                                        style={{
                                            background: isToday ? "#F0F6F2" : "#fff",
                                            border: isToday ? "1.5px solid #2D6A4F" : "1.5px solid #E8E5DF",
                                        }}
                                    >
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#7a7168" }}>
                                                {formatDayLabel(dayStr)}
                                            </span>
                                            {isToday && (
                                                <span
                                                    className="text-[8px] font-semibold uppercase px-1 py-0.5 rounded text-white"
                                                    style={{ background: "#2D6A4F" }}
                                                >
                                                    Today
                                                </span>
                                            )}
                                        </div>
                                        {dayMeals.length === 0 ? (
                                            <p className="text-xs italic" style={{ color: "#c4bdb5" }}>No meals planned</p>
                                        ) : (
                                            <div className="flex flex-col gap-1">
                                                {dayMeals.map(pm => (
                                                    <div key={pm.id} className="flex items-center justify-between gap-1.5">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <span
                                                                className="text-[9px] font-semibold uppercase tracking-wider px-1 py-0.5 rounded flex-shrink-0"
                                                                style={{ background: "#E8E5DF", color: "#7a7168" }}
                                                            >
                                                                {pm.mealType}
                                                            </span>
                                                            <span className="text-xs font-medium truncate" style={{ color: "#1a1a1a" }}>
                                                                {pm.mealName}
                                                            </span>
                                                        </div>
                                                        <Link
                                                            href={`/cook/${pm.id}`}
                                                            className="flex-shrink-0 text-[10px] text-white rounded px-2 py-1 min-h-[26px] flex items-center font-medium hover:opacity-80 transition-opacity"
                                                            style={{ background: "#1a1a1a" }}
                                                        >
                                                            {pm.isCompleted ? "✓" : "Cook"}
                                                        </Link>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                        {/* Panel footer */}
                        <div
                            className="flex-shrink-0 px-4 py-3 border-t flex items-center justify-between"
                            style={{ borderColor: "#E8E5DF" }}
                        >
                            <span className="text-xs" style={{ color: "#9a9288" }}>
                                {totalMeals} {totalMeals === 1 ? "meal" : "meals"} planned
                            </span>
                            <Link
                                href="/shopping-list"
                                className="text-xs font-medium px-2.5 py-1 rounded-full hover:opacity-80 transition-opacity"
                                style={{ background: "#D1EAD9", color: "#1B5E40" }}
                            >
                                Shopping List →
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
