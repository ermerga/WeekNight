"use client"

import { useState, useRef, useEffect } from "react"

type Message = {
    id: string
    role: "user" | "assistant"
    content: string
}

export default function ChatBox() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Auto-scroll to bottom when new messages arrive                        
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // Auto-resize textarea                                                                                
    useEffect(() => {
        const textarea = textareaRef.current
        if (textarea) {
            textarea.style.height = 'auto'
            textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px'
        }
    }, [input])

    useEffect(() => {
        async function loadHistory() {
            const res = await fetch("/api/chat/history")
            if (res.ok) {
                const data = await res.json()
                setMessages(data)
            }
        }
        loadHistory()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input.trim(),
        }

        setMessages((prev) => [...prev, userMessage])
        setInput("")
        setIsLoading(true)

        try {
            // Build conversation history (without the 'id' field that the API doesn't need)
            const conversationHistory = messages.map(({ role, content }) => ({
                role,
                content,
            }))

            const res = await fetch("/api/chat", {  // adjust path to match your route
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: userMessage.content,
                    conversationHistory,
                }),
            })

            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.error || "Failed to get response")
            }

            const data = await res.json()

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.response,
            }
            setMessages((prev) => [...prev, assistantMessage])
        } catch (error) {
            console.error("Error:", error)
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: error instanceof Error
                    ? error.message
                    : "Sorry, something went wrong. Please try again.",
            }
            setMessages((prev) => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-[500px] w-full max-w-2xl bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.role === "user" ?
                            "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2 ${message.role === "user"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-900"
                                }`}
                        >
                            <p
                                className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-2xl px-4 py-2">
                            <div className="flex space-x-2">
                                <div className="w-2 h-2 bg-gray-400          
  rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                                <div className="w-2 h-2 bg-gray-400          
  rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                                <div className="w-2 h-2 bg-gray-400          
  rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
                <form onSubmit={handleSubmit} className="flex gap-3">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            // Submit on Enter (without Shift)                                                             
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSubmit(e)
                            }
                        }}
                        placeholder="Tell me what you want to eat..."
                        rows={1}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2     
                                    focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 text-gray-900 resize-none          
                                    overflow-hidden"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="px-6 py-3 bg-blue-600 text-white          
  rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2               
  focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50                  
  disabled:cursor-not-allowed transition-colors"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    )
}