"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function RegisterPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [name, setName] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError("")

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters")
            return
        }

        setIsLoading(true)

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, name })
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || "Registration failed")
                return
            }

            router.push("/signin")
        } catch {
            setError("Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const inputClass = "w-full px-4 py-2.5 border border-[#E8E5DF] rounded-lg text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F]"
    const labelClass = "block text-sm font-medium text-gray-700 mb-1"

    return (
        <div className="min-h-[calc(100vh-60px)] flex items-center justify-center bg-[#FAF9F6] px-4">
            <div className="w-full max-w-sm">

                {/* Logo mark */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-[#2D6A4F] rounded-2xl flex items-center justify-center mb-3 shadow-sm">
                        <span className="text-white text-xl font-bold">W</span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">Join WeekNight</h1>
                    <p className="text-sm text-gray-500 mt-1">Meal planning for the week ahead</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className={labelClass}>Name <span className="text-gray-400 font-normal">(optional)</span></label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className={labelClass}>Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="you@example.com"
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className={labelClass}>Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="At least 8 characters"
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className={labelClass}>Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Repeat your password"
                            className={inputClass}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#2D6A4F] text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-[#1B5E40] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? "Creating account..." : "Create Account"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500">
                    Already have an account?{" "}
                    <Link href="/signin" className="text-[#2D6A4F] hover:text-[#1B5E40] font-medium">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}
