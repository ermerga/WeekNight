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
                WeekNight
            </span>

            {links.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    style={{
                        color: pathname === link.href ? "#2D6A4F" : "#666",
                        textDecoration: "none",
                        fontWeight: pathname === link.href ? "600" : "400",
                        display: "inline-flex",
                        alignItems: "center",
                        minHeight: "44px",
                        whiteSpace: "nowrap",
                    }}
                >
                    {link.label}
                </Link>
            ))}
        </nav>
    )
}