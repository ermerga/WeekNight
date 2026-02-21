"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Nav() {
    const pathname = usePathname()

    const links = [
        { href: "/", label: "Home" },
        { href: "/planner", label: "Planner" },
        { href: "/meals", label: "Meals" },
        { href: "/inventory", label: "Inventory" },
        { href: "/shopping-list", label: "Shopping List" },
    ]

    return (
        <nav style={{
            display: "flex",
            gap: "20px",
            padding: "16px 24px",
            borderBottom: "1px solid #e5e5e5",
            backgroundColor: "#fff",
        }}>
            <span style={{ fontWeight: "bold", marginRight: "auto" }}>
                Meal Planner
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