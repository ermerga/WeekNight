"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

type Message = {
    id: string
    role: "user" | "assistant"
    content: string
}

export default function ChatBox() {
    const router = useRouter()
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
            router.refresh()
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
        <div className="flex flex-col h-full w-full overflow-hidden bg-white">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
                {messages.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-6">
                        <p className="text-sm font-medium text-gray-700">What are you eating this week?</p>
                        <p className="text-xs text-gray-400 leading-relaxed">Try: "Add pasta for Tuesday dinner" or "Suggest a healthy breakfast"</p>
                    </div>
                )}
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start items-end gap-2"}`}
                    >
                        {message.role === "assistant" && (
                            <div className="w-7 h-7 rounded-full bg-[#2D6A4F] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                                W
                            </div>
                        )}
                        <div
                            className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed ${
                                message.role === "user"
                                    ? "bg-[#2D6A4F] text-white rounded-[18px] rounded-br-[4px] whitespace-pre-wrap"
                                    : "bg-white border border-[#E8E5DF] text-gray-900 rounded-[18px] rounded-bl-[4px]"
                            }`}
                        >
                            {message.role === "user" ? (
                                message.content
                            ) : (
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                        ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 my-1">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 my-1">{children}</ol>,
                                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                                        code: ({ children }) => <code className="bg-gray-100 rounded px-1 py-0.5 text-xs font-mono">{children}</code>,
                                        table: ({ children }) => <div className="overflow-x-auto my-2"><table className="text-xs border-collapse w-full">{children}</table></div>,
                                        thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
                                        th: ({ children }) => <th className="border border-[#E8E5DF] px-2 py-1.5 text-left font-semibold text-gray-700">{children}</th>,
                                        td: ({ children }) => <td className="border border-[#E8E5DF] px-2 py-1.5 text-gray-600">{children}</td>,
                                    }}
                                >
                                    {message.content}
                                </ReactMarkdown>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start items-end gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#2D6A4F] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                            W
                        </div>
                        <div className="bg-white border border-[#E8E5DF] rounded-[18px] rounded-bl-[4px] px-4 py-3">
                            <div className="flex space-x-1.5">
                                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-100 px-4 py-3 bg-white">
                <form onSubmit={handleSubmit} className="flex items-end gap-2">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSubmit(e)
                            }
                        }}
                        placeholder="Tell me what you want to eat..."
                        rows={1}
                        className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full focus:outline-none placeholder:text-gray-400 text-gray-900 text-sm resize-none overflow-hidden leading-relaxed"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="w-9 h-9 flex-shrink-0 flex items-center justify-center bg-[#2D6A4F] rounded-full hover:bg-[#1B5E40] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    )
}