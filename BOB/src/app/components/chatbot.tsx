"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Sparkles, ChevronDown, Loader2, RotateCcw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

interface ChatBotProps {
    /** Pass the AI-generated project object so the bot has full context */
    aiProject: {
        title: string;
        description: string;
        difficultyLevel: string;
        estimatedTime: string;
        steps?: string[];
    } | null;
    /** Whether a project has been generated yet (controls button visibility) */
    visible: boolean;
}

// ─── Typing indicator dots ─────────────────────────────────────────────────────
function TypingDots() {
    return (
        <div className="flex items-center gap-1 px-4 py-3">
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-fuchsia-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
                />
            ))}
        </div>
    );
}

// ─── Message bubble ────────────────────────────────────────────────────────────
function Bubble({ msg }: { msg: Message }) {
    const isUser = msg.role === "user";

    // Very basic markdown-bold renderer (wraps **text** in <strong>)
    const renderContent = (text: string) => {
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, i) =>
            part.startsWith("**") && part.endsWith("**") ? (
                <strong key={i} className="font-semibold text-white">
                    {part.slice(2, -2)}
                </strong>
            ) : (
                <span key={i}>{part}</span>
            )
        );
    };

    return (
        <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
            {!isUser && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-fuchsia-600 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_8px_rgba(192,38,211,0.5)]">
                    <Bot className="w-3.5 h-3.5 text-white" />
                </div>
            )}
            <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isUser
                        ? "bg-gradient-to-br from-fuchsia-600 to-indigo-600 text-white rounded-tr-sm shadow-[0_0_12px_rgba(192,38,211,0.3)]"
                        : "bg-slate-800 text-slate-200 rounded-tl-sm border border-white/5"
                    }`}
            >
                {renderContent(msg.content)}
            </div>
        </div>
    );
}

// ─── Main ChatBot component ────────────────────────────────────────────────────
export default function ChatBot({ aiProject, visible }: ChatBotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [hasBeenOpened, setHasBeenOpened] = useState(false);
    const [showPulse, setShowPulse] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const chatPanelRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // When a new project is generated, pulse the button and auto-add greeting
    useEffect(() => {
        if (!aiProject) return;
        setShowPulse(true);
        setMessages([
            {
                id: "welcome",
                role: "assistant",
                content: `I just invented **${aiProject.title}** for you! 🚀 Ask me anything — wiring diagrams, code snippets, component substitutions, or how to extend it.`,
                timestamp: new Date(),
            },
        ]);
        const t = setTimeout(() => setShowPulse(false), 6000);
        return () => clearTimeout(t);
    }, [aiProject]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen) {
            setHasBeenOpened(true);
            setTimeout(() => inputRef.current?.focus(), 200);
        }
    }, [isOpen]);

    // Click-outside to close
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                isOpen &&
                chatPanelRef.current &&
                !chatPanelRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [isOpen]);

    // Auto-resize textarea
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        e.target.style.height = "auto";
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
    };

    const sendMessage = async () => {
        const trimmed = input.trim();
        if (!trimmed || isTyping) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: trimmed,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        if (inputRef.current) inputRef.current.style.height = "auto";
        setIsTyping(true);

        try {
            
            const history = messages
                .filter(m => m.id !== "welcome" && m.id !== "welcome-reset") // skip welcome cards
                .map((m) => ({
                    role: m.role,
                    content: m.content,
                }));

            
            const response = await fetch("/api/chatbot/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_question: trimmed,
                    project_title: aiProject?.title || "Unknown Hardware Assembly",
                    project_description: aiProject?.description || "",
                    project_steps: aiProject?.steps || [],
                    chat_history: history,
                }),
            });

            if (!response.ok) {
                throw new Error(`Server returned status code: ${response.status}`);
            }

            const data = await response.json();

            
            const replyText = data?.reply || "Sorry, I couldn't generate a troubleshooting step. Please try again.";

            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: replyText,
                    timestamp: new Date(),
                },
            ]);
        } catch (err) {
            console.error("BOB Chatbot sync failure:", err);
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: "Connection error — failed to reach the BOB routing engine. Please try again.",
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const resetChat = () => {
        if (!aiProject) return;
        setMessages([
            {
                id: "welcome-reset",
                role: "assistant",
                content: `Chat reset! Still here to help with **${aiProject.title}**. What do you need?`,
                timestamp: new Date(),
            },
        ]);
    };

    if (!visible) return null;

    return (
        <>
            {/* ── Floating trigger button ── */}
            <div className="fixed bottom-6 right-6 z-50" ref={chatPanelRef}>
                {/* Chat panel */}
                <div
                    className={`absolute bottom-16 right-0 w-[360px] sm:w-[400px] transition-all duration-300 origin-bottom-right ${isOpen
                            ? "opacity-100 scale-100 translate-y-0"
                            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
                        }`}
                    style={{ maxHeight: "calc(100vh - 100px)" }}
                >
                    <div className="flex flex-col bg-slate-950 border border-fuchsia-500/30 rounded-2xl overflow-hidden shadow-[0_8px_60px_rgba(192,38,211,0.25),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-xl"
                        style={{ height: "520px" }}>

                        {/* Header */}
                        <div className="relative flex items-center gap-3 px-4 py-3.5 border-b border-white/5 bg-gradient-to-r from-fuchsia-600/10 to-indigo-600/10 flex-shrink-0">
                            {/* Subtle top glow */}
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500/50 to-transparent" />

                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-fuchsia-600 to-indigo-600 flex items-center justify-center shadow-[0_0_12px_rgba(192,38,211,0.5)]">
                                <Bot className="w-4 h-4 text-white" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white leading-none mb-0.5">Project AI</p>
                                <p className="text-xs text-fuchsia-400/70 truncate">
                                    {aiProject ? `Advisor for: ${aiProject.title}` : "Ready when you invent a project"}
                                </p>
                            </div>

                            <div className="flex items-center gap-1">
                                {messages.length > 1 && (
                                    <button
                                        onClick={resetChat}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
                                        title="Reset chat"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
                                >
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages area */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-600/20 to-indigo-600/20 flex items-center justify-center border border-fuchsia-500/20">
                                        <Sparkles className="w-6 h-6 text-fuchsia-400" />
                                    </div>
                                    <p className="text-sm text-slate-400">
                                        Click <strong className="text-fuchsia-400 font-semibold">AI Auto-Invent</strong> first to generate a project, then I'll guide you through building it.
                                    </p>
                                </div>
                            )}

                            {messages.map((msg) => (
                                <Bubble key={msg.id} msg={msg} />
                            ))}

                            {isTyping && (
                                <div className="flex gap-2">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-fuchsia-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-[0_0_8px_rgba(192,38,211,0.5)]">
                                        <Bot className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <div className="bg-slate-800 border border-white/5 rounded-2xl rounded-tl-sm">
                                        <TypingDots />
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick suggestions */}
                        {messages.length === 1 && aiProject && (
                            <div className="px-4 pb-2 flex gap-2 flex-wrap flex-shrink-0">
                                {["How do I wire this?", "Give me the code", "What components can I swap?"].map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => {
                                            setInput(q);
                                            setTimeout(() => {
                                                setInput(q);
                                                inputRef.current?.focus();
                                            }, 0);
                                        }}
                                        className="text-xs px-3 py-1.5 rounded-full border border-fuchsia-500/20 text-fuchsia-400/80 hover:text-fuchsia-300 hover:border-fuchsia-500/40 hover:bg-fuchsia-500/5 transition-all"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input area */}
                        <div className="px-3 pb-3 pt-2 flex-shrink-0 border-t border-white/5">
                            <div className="flex items-end gap-2 bg-slate-900 rounded-xl border border-white/10 focus-within:border-fuchsia-500/40 focus-within:shadow-[0_0_0_3px_rgba(192,38,211,0.1)] transition-all px-3 py-2">
                                <textarea
                                    ref={inputRef}
                                    rows={1}
                                    value={input}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder={aiProject ? "Ask about your project…" : "Generate a project first…"}
                                    disabled={!aiProject || isTyping}
                                    className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 resize-none outline-none leading-relaxed disabled:opacity-40"
                                    style={{ maxHeight: "120px" }}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!input.trim() || !aiProject || isTyping}
                                    className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-600 to-indigo-600 flex items-center justify-center flex-shrink-0 transition-all hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(192,38,211,0.3)] disabled:shadow-none"
                                >
                                    {isTyping ? (
                                        <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                                    ) : (
                                        <Send className="w-3.5 h-3.5 text-white" />
                                    )}
                                </button>
                            </div>
                            <p className="text-center text-[10px] text-slate-700 mt-1.5">
                                Enter to send · Shift+Enter for new line
                            </p>
                        </div>
                    </div>
                </div>

                {/* The FAB button */}
                <button
                    onClick={() => setIsOpen((o) => !o)}
                    className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-600 to-indigo-600 flex items-center justify-center shadow-[0_4px_20px_rgba(192,38,211,0.5)] transition-all duration-300 hover:shadow-[0_4px_30px_rgba(192,38,211,0.7)] hover:scale-105 active:scale-95 ${isOpen ? "rotate-0" : ""
                        }`}
                    title="Open Project AI chat"
                >
                    {/* Pulse rings when a new project arrives */}
                    {showPulse && !isOpen && (
                        <>
                            <span className="absolute inset-0 rounded-2xl bg-fuchsia-500/40 animate-ping" />
                            <span className="absolute -inset-1 rounded-2xl bg-fuchsia-500/20 animate-ping" style={{ animationDelay: "0.3s" }} />
                        </>
                    )}

                    {/* Unread dot */}
                    {!isOpen && messages.length > 0 && !hasBeenOpened && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 border-2 border-slate-950 text-[9px] text-white flex items-center justify-center font-bold">
                            1
                        </span>
                    )}

                    {isOpen ? (
                        <X className="w-5 h-5 text-white transition-transform" />
                    ) : (
                        <Bot className="w-6 h-6 text-white" />
                    )}
                </button>
            </div>
        </>
    );
}