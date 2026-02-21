import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcrypt"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt" // Required for Credentials provider
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user || !user.password) {
          return null
        }

        // Check password
        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!passwordMatch) {
          return null
        }

        // Return user if valid
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      }
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      // Add user ID to JWT token when user signs in
      if (user) {
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      // Add user ID from JWT token to session
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})
