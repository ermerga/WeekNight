import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";


export async function GET() {
    const session = await auth(); 
    if (!session?.user?.id) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401})
    }

    const userId = session.user.id;

    const chatHistory = await prisma.chatMessage.findMany({
        where: {
            userId: userId
        },
        orderBy: {
            createdAt: 'asc'
        }
    })
    return NextResponse.json(chatHistory, {status: 200})
}