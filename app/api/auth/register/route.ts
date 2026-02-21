import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"

export async function POST(request: Request) {
    try {
        // 1. Get the data from the request body
        const { email, password, name } = await request.json()

        // 2. Validate inputs - make sure they sent email and password
        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            )
        }

        // 3. Check password strength - minimum 8 characters
        if (password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters" },
                { status: 400 }
            )
        }

        // 4. Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: "User with this email already exists" },
                { status: 400 }
            )
        }

        // 5. Hash the password with bcrypt (10 salt rounds)
        const hashedPassword = await bcrypt.hash(password, 10)

        // 6. Create the user in the database
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || null,
            }
        })

        // 7. Return success response
        return NextResponse.json(
            { message: "User created successfully", userId: user.id },
            { status: 201 }
        )
    } catch (error) {
        // 8. Handle any unexpected errors
        console.error("Registration error:", error)
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        )
    }
}
