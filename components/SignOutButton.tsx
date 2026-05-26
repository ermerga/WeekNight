"use client"

import { signOut } from "next-auth/react"

export default function SignOutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors min-h-[44px] px-2 flex items-center"
        >
            Sign Out
        </button>
    )
}
