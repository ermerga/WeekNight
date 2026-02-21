import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import ChatBox from "@/components/chat/ChatBox"
import SignOutButton from "@/components/SignOutButton"

export default async function Home() {
  const session = await auth()

  if (!session) {
    redirect("/signin")
  }

  return (
    <main className="h-[calc(100vh-60px)] bg-gray-100 flex flex-col items-center justify-center p-6 relative">
      {/* Sign Out button in top-right corner */}
      <div className="absolute top-6 right-6">
        <SignOutButton />
      </div>

      <h1 className="text-2xl font-semibold text-gray-800 mb-4">
        Welcome, {session.user?.name?.split(" ")[0]}
      </h1>
      <ChatBox />
    </main>
  )
} 
