"use client"

import { signOut } from "next-auth/react"

export default function SignOutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
        >
            Sign Out
        </button>
    )
}
