"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Nav({ isSignedIn }: { isSignedIn: boolean }) {
    const pathname = usePathname()

    const links = isSignedIn ? [
        { href: "/", label: "Home" },
        { href: "/meals", label: "Meals" },
        { href: "/shopping-list", label: "Shopping List" },
    ] : []

    return (
        <nav style={{
            display: "flex",
            gap: "20px",
            padding: "16px 24px",
            borderBottom: "1px solid #e5e5e5",
            backgroundColor: "#fff",
        }}>
            <span style={{ fontWeight: "bold", marginRight: "auto", color: "#000" }}>
                weeknight.ai
            </span>

            {links.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    style={{
                        color: pathname === link.href ? "#2563eb" : "#666",
                        textDecoration: "none",
                        fontWeight: pathname === link.href ? "600" : "400",
                    }}
                >
                    {link.label}
                </Link>
            ))}
        </nav>
    )
}