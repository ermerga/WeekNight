"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"

export default function SignOutButton() {
    const [isLoading, setIsLoading] = useState(false)

    return (
        <button
            onClick={() => { setIsLoading(true); signOut({ callbackUrl: "/signin" }) }}
            disabled={isLoading}
            className="text-xs text-gray-400 hover:text-gray-700 cursor-pointer transition-colors min-h-[44px] px-2 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isLoading ? "Signing out..." : "Sign Out"}
        </button>
    )
}
