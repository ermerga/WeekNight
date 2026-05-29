"use client"

import { useState, FormEvent } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

export default function SignInPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()

    const urlError = searchParams.get("error")

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError("Invalid email or password")
            } else {
                router.push("/")
                router.refresh()
            }
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
                    <h1 className="text-xl font-bold text-gray-900">Welcome back</h1>
                    <p className="text-sm text-gray-500 mt-1">Sign in to WeekNight</p>
                </div>

                {/* Google */}
                <button
                    onClick={() => signIn("google", { callbackUrl: "/" })}
                    className="w-full flex items-center justify-center gap-3 bg-white border border-[#E8E5DF] text-gray-700 py-2.5 px-4 rounded-lg text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] focus:ring-offset-2 mb-5 transition-colors"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                </button>

                <div className="relative mb-5">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#E8E5DF]" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-[#FAF9F6] text-gray-400">or continue with email</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                            placeholder="••••••••"
                            className={inputClass}
                        />
                    </div>

                    {(error || urlError) && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error || "Authentication failed"}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#2D6A4F] text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-[#1B5E40] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="text-[#2D6A4F] hover:text-[#1B5E40] font-medium">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    )
}
