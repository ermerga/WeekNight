import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic();

type Message = {
    role: "user" | "assistant"
    content: string
}

type expectedRequest = {
    message: string
    conversationHistory: Message[]
}

type AddMealInput = {
    day: string
    meal_name: string
    meal_type: string
}

type CreateMealInput = {
    name: string
    description?: string
    servings?: number
    prepTime?: number
    cuisine?: string
    steps?: string[]
    ingredients: {
        foodName: string
        quantity: number
        unit: string
    }[]
}

type RemoveMealInput = {
    day: string
    meal_name: string
    meal_type?: string
}
type ShoppingListAdd = {
    name: string
    quantity?: number
    unit?: string
    notes?: string
}


// Define the tools array once to avoid repetition                                                                                      
const tools: Anthropic.Tool[] = [
    {
        name: "add-meal-to-plan",
        description: "Add a meal to the weekly plan. The meal name can be approximate, partial, or descriptive - the system will find the best match.",
        input_schema: {
            type: "object",
            properties: {
                day: {
                    type: "string",
                    description: "MUST be a specific date in YYYY-MM-DD format (e.g. '2026-05-29'). Never pass a day name like 'monday'. Calculate the exact date from the current date in your system prompt.",
                },
                meal_name: {
                    type: "string",
                    description: "The name or description of the meal. Can be approximate, partial, or descriptive - the system uses fuzzy matching and semantic search to find the best match."
                },
                meal_type: {
                    type: "string",
                    description: "Which meal of the day",
                    enum: ["breakfast", "lunch", "dinner"]
                }
            },
            required: ["day", "meal_name", "meal_type"]
        }
    },
    {
        name: "create-meal",
        description: "Create a new meal with ingredients",
        input_schema: {
            type: "object",
            properties: {
                name: {
                    type: "string",
                    description: "The name of the meal"
                },
                description: {
                    type: "string",
                    description: "A brief description of the meal"
                },
                servings: {
                    type: "number",
                    description: "Number of servings this meal makes"
                },
                prepTime: {
                    type: "number",
                    description: "Preparation time in minutes"
                },
                cuisine: {
                    type: "string",
                    description: "Type of cuisine (e.g., Italian, Mexican, American)"
                },
                steps: {
                    type: "array",
                    description: "Step-by-step cooking instructions. Each step should be a clear, single action (e.g. 'Heat olive oil in a large pan over medium heat'). Include 4-10 steps.",
                    items: { type: "string" }
                },
                ingredients: {
                    type: "array",
                    description: "List of ingredients for the meal",
                    items: {
                        type: "object",
                        properties: {
                            foodName: {
                                type: "string",
                                description: "Name of the ingredient"
                            },
                            quantity: {
                                type: "number",
                                description: "Amount of the ingredient"
                            },
                            unit: {
                                type: "string",
                                description: "Unit of measurement (e.g., cups, oz, lbs, pieces)"
                            }
                        },
                        required: ["foodName", "quantity", "unit"]
                    }
                }
            },
            required: ["name", "ingredients"]
        }
    },
    {
        name: "remove-meal-from-plan",
        description: "Removing the said meal from the plan. The meal name can be approximate, partial, or descriptive - the system will find the best match.",
        input_schema: {
            type: "object",
            properties: {
                day: {
                    type: "string",
                    description: "MUST be a specific date in YYYY-MM-DD format (e.g. '2026-05-29'). Never pass a day name like 'monday'. Calculate the exact date from the current date in your system prompt.",
                },
                meal_name: {
                    type: "string",
                    description: "The name or description of the meal. Can be approximate, partial, or descriptive - the system uses fuzzy matching and semantic search to find the best match."
                },
                meal_type: {
                    type: "string",
                    description: "Which meal of the day",
                    enum: ["breakfast", "lunch", "dinner"]
                }
            },
            required: ["day", "meal_name"]
        }
    }, 
    {
        name: "add-item-shopping-list",
        description: "User is adding a seperate item that is not apart of a meal to the shopping list", 
        input_schema: {
            type: "object",
            properties: {
                name: {
                    type: "string",
                    description: "The name of the item that is getting added to the list"
                }, 
                quantity: {
                    type: "number", 
                    description: "The amount of the item that the user is wanting to add"
                }, 
                unit: {
                    type: "string",
                    description: "The unit of the item that they are wanting to add. Such as GALLONS of milk. Or Boxes of bags."
                },
                notes: {
                    type: "string",
                    description: "Any additional information the user may include that might be nice to store"
                }
            }, 
            required: ["name"]
        }
    }
]


function getSystemPrompt(): string {
    const now = new Date()
    const dayDisplayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    const todayName = dayDisplayNames[now.getDay()]
    const tomorrowName = dayDisplayNames[(now.getDay() + 1) % 7]
    const dateStr = `${monthNames[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`

    return `You are a weekly meal planner assistant. Today is ${todayName}, ${dateStr}.

CRITICAL — date handling: Always pass the "day" parameter as a specific YYYY-MM-DD date (e.g. "${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}"), NEVER as a day name like "monday" or "friday". Calculate the exact date using today's date above.

Date reference guide (from today ${todayName} ${dateStr}):
- "tonight" / "today" → today's date
- "tomorrow" → tomorrow's date
- "this [day]" → the upcoming occurrence of that day this week (or today if it matches)
- "next [day]" or "[day] of next week" → that day in the FOLLOWING week (always 7+ days from today)
- "next week" with no specific day → start from next Sunday and assign days across the week

You help users plan meals and manage their weekly meal schedule. When a user wants to add or remove a meal, use the appropriate tool with whatever description they provide - even if it's vague like 'the chicken dish' or 'something Italian'. The system uses fuzzy matching and semantic search to automatically find the best match. If no match is found, the tool will report that and you can ask for clarification then. Don't ask for exact meal names upfront - just try the tool first. If a user asks an unrelated question, respond that you can only help with meal planning. The user can also add items to the shopping list that are not associated to a specific meal.`
}

function getDateFromDay(day: string): string {
    // Check if input is already a specific date (e.g. "2026-02-28")
    if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
        return day
    }

    // Otherwise treat it as a day name and find next occurrence
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const today = new Date()
    const todayIndex = today.getDay()
    const targetIndex = days.indexOf(day.toLowerCase())

    let daysUntil = targetIndex - todayIndex
    if (daysUntil < 0) daysUntil += 7

    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + daysUntil)

    const year = targetDate.getFullYear()
    const month = String(targetDate.getMonth() + 1).padStart(2, '0')
    const day_num = String(targetDate.getDate()).padStart(2, '0')
    return `${year}-${month}-${day_num}`
}

function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
}

const MAX_CONTEXT_TOKENS = 2000;

async function summarizeMessages(messages: Message[]): Promise<string> {
    const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        system: "Summarize this conversation concisely. Focus on key decisions, preferences, and any meals discussed. Keep it brief.",
        messages: [
            {
                role: "user",
                content: messages.map(m => `${m.role}: ${m.content}`).join("\n")
            }
        ]
    })

    return response.content[0].type === "text"
        ? response.content[0].text
        : ""
}

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Load existing user context if available                                                             
    const existingContext = await prisma.userContext.findUnique({
        where: { userId: session.user.id }
    })

    const body: expectedRequest = await request.json();

    // Check if current message is too long                                                                
    const MAX_MESSAGE_TOKENS = 1200
    const messageTokens = estimateTokens(body.message)

    if (messageTokens > MAX_MESSAGE_TOKENS) {
        return NextResponse.json(
            {
                error: `Message too long. Please keep messages under ~${MAX_MESSAGE_TOKENS * 4} characters.`
            },
            { status: 400 }
        )
    }

    // If starting fresh but have previous context, include it                                             
    if (body.conversationHistory.length === 0 && existingContext?.summary) {
        body.conversationHistory = [
            { role: "assistant", content: `Previous conversation summary: ${existingContext.summary}` }
        ]
    }

    const totalTokens = body.conversationHistory.reduce(
        (sum, msg) => sum + estimateTokens(msg.content),
        0
    )

    if (totalTokens > MAX_CONTEXT_TOKENS) {
        // Split: summarize first half, keep second half                                                   
        const midpoint = Math.floor(body.conversationHistory.length / 2)
        const oldMessages = body.conversationHistory.slice(0, midpoint)
        const recentMessages = body.conversationHistory.slice(midpoint)

        // Summarize old messages                                                                          
        const summary = await summarizeMessages(oldMessages)

        // Save to UserContext                                                                             
        await prisma.userContext.upsert({
            where: { userId: session.user.id },
            update: { summary },
            create: { userId: session.user.id, summary }
        })

        // Delete old messages from database                                                               
        // Get IDs of messages to keep (most recent ones)                                                  
        const messagesToKeep = await prisma.chatMessage.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            take: recentMessages.length,
            select: { id: true }
        })

        const keepIds = messagesToKeep.map(m => m.id)

        await prisma.chatMessage.deleteMany({
            where: {
                userId: session.user.id,
                id: { notIn: keepIds }
            }
        })

        // Replace conversation history with summary + recent                                              
        body.conversationHistory = [
            { role: "assistant", content: `Previous conversation summary: ${summary}` },
            ...recentMessages
        ]
    }

    await prisma.chatMessage.create({
        data: {
            userId: session.user.id,
            role: "user",
            content: body.message
        }
    })

    const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: getSystemPrompt(),
        messages: [
            ...body.conversationHistory,
            { role: "user", content: body.message }
        ],
        tools
    })

    // Agentic loop: keep processing tool calls until Claude says it's done
    const MAX_ITERATIONS = 10
    const agentMessages: Anthropic.MessageParam[] = [
        ...body.conversationHistory,
        { role: "user", content: body.message }
    ]

    let currentResponse = response
    let iterations = 0

    while (
        (currentResponse.stop_reason === "tool_use" || currentResponse.stop_reason === "max_tokens") &&
        iterations < MAX_ITERATIONS
    ) {
        iterations++

        const toolUseBlocks = currentResponse.content.filter(block => block.type === "tool_use")

        // If we hit max_tokens with no tool calls, Claude got cut off mid-text — stop and report
        if (toolUseBlocks.length === 0) break

        // Add Claude's response (which contains the tool_use blocks) to the message history
        agentMessages.push({ role: "assistant", content: currentResponse.content })

        // Execute each tool call and collect results
        const toolResults: Anthropic.ToolResultBlockParam[] = []

        for (const toolUseBlock of toolUseBlocks) {
            if (toolUseBlock.type !== "tool_use") continue

            let result: unknown

            const baseUrl = process.env.NEXTAUTH_URL ||
                (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

            if (toolUseBlock.name === "add-meal-to-plan") {
                const { day, meal_name, meal_type } = toolUseBlock.input as AddMealInput
                const targetDate = getDateFromDay(day)
                const url = new URL('/api/tools/add-to-plan', baseUrl)
                const toolResponse = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Cookie': request.headers.get('cookie') || '' },
                    body: JSON.stringify({ mealName: meal_name, date: targetDate, mealType: meal_type })
                })
                result = await toolResponse.json()

            } else if (toolUseBlock.name === "create-meal") {
                const { name, description, servings, prepTime, cuisine, steps, ingredients } = toolUseBlock.input as CreateMealInput
                const url = new URL('/api/tools/create-meal', baseUrl)
                const toolResponse = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Cookie': request.headers.get('cookie') || '' },
                    body: JSON.stringify({ name, description, servings, prepTime, cuisine, steps, ingredients })
                })
                result = await toolResponse.json()

            } else if (toolUseBlock.name === "remove-meal-from-plan") {
                const { day, meal_name, meal_type } = toolUseBlock.input as RemoveMealInput
                const targetDate = getDateFromDay(day)
                const url = new URL('/api/tools/remove-from-plan', baseUrl)
                const toolResponse = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Cookie': request.headers.get('cookie') || '' },
                    body: JSON.stringify({ mealName: meal_name, date: targetDate, mealType: meal_type })
                })
                result = await toolResponse.json()

            } else if (toolUseBlock.name === "add-item-shopping-list") {
                const { name, quantity, unit, notes } = toolUseBlock.input as ShoppingListAdd
                const url = new URL('/api/tools/add-list', baseUrl)
                const toolResponse = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Cookie': request.headers.get('cookie') || '' },
                    body: JSON.stringify({ name, quantity, unit, notes })
                })
                result = await toolResponse.json()
            }

            toolResults.push({
                type: "tool_result",
                tool_use_id: toolUseBlock.id,
                content: JSON.stringify(result)
            })
        }

        // Add tool results and get Claude's next response
        agentMessages.push({ role: "user", content: toolResults })

        currentResponse = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 4096,
            system: getSystemPrompt(),
            messages: agentMessages,
            tools
        })
    }

    // Extract final text response
    const textBlock = currentResponse.content.find(block => block.type === "text")
    let assistantMessage = textBlock?.type === "text" ? textBlock.text : ""

    if (iterations >= MAX_ITERATIONS) {
        assistantMessage += "\n\n(Note: I hit the limit for a single request. If anything was missed, just ask me to continue.)"
    }

    if (!assistantMessage) {
        assistantMessage = "Done! Let me know if you'd like any changes."
    }

    await prisma.chatMessage.create({
        data: {
            userId: session.user.id,
            role: "assistant",
            content: assistantMessage
        }
    })

    return NextResponse.json({
        response: assistantMessage,
        conversationHistory: [
            ...body.conversationHistory,
            { role: "user", content: body.message },
            { role: "assistant", content: assistantMessage }
        ]
    })
}