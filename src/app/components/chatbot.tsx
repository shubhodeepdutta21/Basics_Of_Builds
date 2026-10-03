"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Sparkles, ChevronDown, Loader2, RotateCcw } from "lucide-react";
import { authFetch } from "@/lib/authFetch";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

export interface ProjectContext {
    id?: string;
    title: string;
    description: string;
    difficultyLevel?: string;
    estimatedTime?: string;
    requirements?: unknown[];
    steps?: string[];
}

interface ChatBotProps {
    /** Pass the AI-generated project object so the bot has full context */
    aiProject?: ProjectContext | null;
    /** Pass a standard or active project object */
    project?: ProjectContext | null;
    /** Whether a project is active / controls button visibility */
    visible?: boolean;
}

// ─── Typing indicator dots ─────────────────────────────────────────────────────
function TypingDots() {
    return (
        <div className="flex items-center gap-1 px-4 py-3">
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-[#e8c547] animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
                />
            ))}
        </div>
    );
}

// ─── Message bubble ────────────────────────────────────────────────────────────
function Bubble({ msg }: { msg: Message }) {
    const isUser = msg.role === "user";

    const renderContent = (text: string) => {
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, i) =>
            part.startsWith("**") && part.endsWith("**") ? (
                <strong key={i} className="font-semibold text-[#e8c547]">
                    {part.slice(2, -2)}
                </strong>
            ) : (
                <span key={i}>{part}</span>
            )
        );
    };

    return (
        <div className={`flex gap-2 font-grotesk ${isUser ? "flex-row-reverse" : "flex-row"}`}>
            {!isUser && (
                <div className="w-7 h-7 rounded-full bg-[#1f1f1f] border border-[#3a3a3a] flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_8px_rgba(232,197,71,0.3)]">
                    <Bot className="w-3.5 h-3.5 text-[#e8c547]" />
                </div>
            )}
            <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isUser
                        ? "bg-[#e8c547] text-[#0d0d0d] font-medium rounded-tr-sm shadow-[0_0_12px_rgba(232,197,71,0.2)]"
                        : "bg-[#1f1f1f] text-[#f0ede6] rounded-tl-sm border border-[#2a2a2a]"
                    }`}
            >
                {renderContent(msg.content)}
            </div>
        </div>
    );
}

// ─── Main ChatBot component ────────────────────────────────────────────────────
export default function ChatBot({ aiProject, project, visible = true }: ChatBotProps) {
    const activeProject = project || aiProject;

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [hasBeenOpened, setHasBeenOpened] = useState(false);
    const [showPulse, setShowPulse] = useState(false);
    const [ loadedKey, setLoadedKey ] = useState("");

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const chatPanelRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

        // A primitive string that changes ONLY when the project's content changes.
    // Strings compare by value, so a new-but-identical object does not trigger the effect.
    const projectKey = activeProject
        ? `${activeProject.id ?? ""}|${activeProject.title}|${activeProject.description}`
        : "";
    const projectTitle = activeProject?.title;

    // One localStorage entry per project, so each project keeps its own conversation
    const storageKey = activeProject
        ? `bob_chat_${activeProject.id ?? activeProject.title}`
        : "";

    // LOAD: when the project changes (or on first mount), restore its saved chat.
    // Only if nothing valid is saved do we start fresh with the greeting.
    useEffect(() => {
        if (!storageKey) return;

        let restored: Message[] = [];
        try {
            const raw = localStorage.getItem(storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    // Keep only well-formed messages (guards against corrupted storage)
                    restored = parsed.filter(
                        (m): m is Message =>
                            m &&
                            (m.role === "user" || m.role === "assistant") &&
                            typeof m.content === "string" &&
                            typeof m.id === "string"
                    );
                }
            }
        } catch (e) {
            console.error("Failed to restore chat", e);
        }

        if (restored.length > 0) {
            // Returning to an existing conversation: restore it, no attention-grabbing pulse
            setMessages(restored);
        } else {
            setShowPulse(true);
            setMessages([
                {
                    id: "welcome",
                    role: "assistant",
                    content: `I'm ready to help you build **${projectTitle}**! 🚀 Ask me anything — wiring diagrams, code snippets, component substitutions, or assembly steps.`,
                    timestamp: new Date(),
                },
            ]);
        }

        // Mark loading as finished for THIS project; the save effect may now run
        setLoadedKey(storageKey);

        const t = setTimeout(() => setShowPulse(false), 6000);
        return () => clearTimeout(t);
    }, [projectKey, projectTitle, storageKey]);

    // SAVE: persist on every change, but only once loading for this project is done
    useEffect(() => {
        if (!storageKey || loadedKey !== storageKey) return;
        try {
            // Keep the most recent 50 messages so storage can't grow forever
            localStorage.setItem(storageKey, JSON.stringify(messages.slice(-50)));
        } catch (e) {
            console.error("Failed to save chat", e);
        }
    }, [messages, storageKey, loadedKey]);

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
                .filter(m => m.id !== "welcome" && m.id !== "welcome-reset")
                .map((m) => ({
                    role: m.role,
                    content: m.content,
                }));

            const response = await authFetch("/api/chatbot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_question: trimmed,
                    active_project_title: activeProject?.title || "Hardware Project",
                    project_title: activeProject?.title || "Hardware Project",
                    project_description: activeProject?.description || "",
                    difficulty_level: activeProject?.difficultyLevel || "",
                    estimated_time: activeProject?.estimatedTime || "",
                    project_steps: activeProject?.steps || [],
                    project_instructions: Array.isArray(activeProject?.steps) ? activeProject.steps.join("\n") : "",
                    requirements: activeProject?.requirements || [],
                    chat_history: history,
                }),
            });

            const data = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(data?.error || `Server returned status code: ${response.status}`);
            }

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
                     content:
                           err instanceof TypeError
                               ? "Connection error — failed to reach the BOB routing engine. Please try again."
                               : (err as Error)?.message || "Something went wrong. Please try again.",
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
        if (!activeProject) return;
        setMessages([
            {
                id: "welcome-reset",
                role: "assistant",
                content: `Chat reset! Still here to help with **${activeProject.title}**. What do you need?`,
                timestamp: new Date(),
            },
        ]);
    };

    if (!visible) return null;

    return (
        <>
            {/* ── Floating trigger button ── */}
            <div className="fixed bottom-6 right-6 z-50 font-grotesk" ref={chatPanelRef}>
                {/* Chat panel */}
                <div
                    className={`absolute bottom-16 right-0 w-90 sm:w-100 transition-all duration-300 origin-bottom-right ${isOpen
                            ? "opacity-100 scale-100 translate-y-0"
                            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
                        }`}
                    style={{ maxHeight: "calc(100vh - 100px)" }}
                >
                    <div className="flex flex-col bg-[#161616] border border-[#e8c547]/40 rounded-2xl overflow-hidden shadow-[0_8px_60px_rgba(232,197,71,0.2)] backdrop-blur-xl"
                        style={{ height: "520px" }}>

                        {/* Header */}
                        <div className="relative flex items-center gap-3 px-4 py-3.5 border-b border-[#2a2a2a] bg-[#1f1f1f] shrink-0">
                            <div className="w-8 h-8 rounded-xl bg-[#0d0d0d] border border-[#e8c547]/40 flex items-center justify-center shadow-[0_0_12px_rgba(232,197,71,0.3)]">
                                <Bot className="w-4 h-4 text-[#e8c547]" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[#f0ede6] leading-none mb-0.5">Project AI Assistant</p>
                                <p className="text-xs font-mono text-[#e8c547] truncate">
                                    {activeProject ? `Advisor: ${activeProject.title}` : "Ready to help with your project"}
                                </p>
                            </div>

                            <div className="flex items-center gap-1">
                                {messages.length > 1 && (
                                    <button
                                        onClick={resetChat}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#888888] hover:text-[#f0ede6] hover:bg-[#2a2a2a] transition-colors"
                                        title="Reset chat"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#888888] hover:text-[#f0ede6] hover:bg-[#2a2a2a] transition-colors"
                                >
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages area */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-[#1f1f1f] flex items-center justify-center border border-[#e8c547]/30">
                                        <Sparkles className="w-6 h-6 text-[#e8c547]" />
                                    </div>
                                    <p className="text-sm text-[#888888]">
                                        Ask any question about your project, wiring, component pinouts, or code!
                                    </p>
                                </div>
                            )}

                            {messages.map((msg) => (
                                <Bubble key={msg.id} msg={msg} />
                            ))}

                            {isTyping && (
                                <div className="flex gap-2">
                                    <div className="w-7 h-7 rounded-full bg-[#1f1f1f] border border-[#3a3a3a] flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(232,197,71,0.3)]">
                                        <Bot className="w-3.5 h-3.5 text-[#e8c547]" />
                                    </div>
                                    <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-2xl rounded-tl-sm">
                                        <TypingDots />
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick suggestions */}
                        {messages.length === 1 && activeProject && (
                            <div className="px-4 pb-2 flex gap-2 flex-wrap shrink-0">
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
                                        className="text-xs font-mono px-3 py-1.5 rounded-full border border-[#e8c547]/30 text-[#e8c547] hover:bg-[#e8c547]/10 transition-all"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input area */}
                        <div className="px-3 pb-3 pt-2 shrink-0 border-t border-[#2a2a2a] bg-[#0d0d0d]">
                            <div className="flex items-end gap-2 bg-[#161616] rounded-xl border border-[#3a3a3a] focus-within:border-[#e8c547] transition-all px-3 py-2">
                                <textarea
                                    ref={inputRef}
                                    rows={1}
                                    value={input}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder={activeProject ? "Ask about your project…" : "Select or generate a project first…"}
                                    disabled={!activeProject || isTyping}
                                    className="flex-1 bg-transparent text-sm text-[#f0ede6] placeholder-[#888888] resize-none outline-none leading-relaxed disabled:opacity-40"
                                    style={{ maxHeight: "120px" }}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!input.trim() || !activeProject || isTyping}
                                    className="w-8 h-8 rounded-lg bg-[#e8c547] hover:bg-[#c4a332] text-[#0d0d0d] flex items-center justify-center shrink-0 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(232,197,71,0.2)] disabled:shadow-none"
                                >
                                    {isTyping ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Send className="w-3.5 h-3.5" />
                                    )}
                                </button>
                            </div>
                            <p className="text-center text-[10px] font-mono text-[#888888] mt-1.5">
                                Enter to send · Shift+Enter for new line
                            </p>
                        </div>
                    </div>
                </div>

                {/* FAB button */}
                <button
                    onClick={() => setIsOpen((o) => !o)}
                    className="relative w-14 h-14 rounded-2xl bg-[#e8c547] hover:bg-[#c4a332] text-[#0d0d0d] flex items-center justify-center shadow-[0_4px_20px_rgba(232,197,71,0.4)] transition-all duration-300 hover:scale-105 active:scale-95"
                    title="Open Project AI chat"
                >
                    {showPulse && !isOpen && (
                        <>
                            <span className="absolute inset-0 rounded-2xl bg-[#e8c547]/40 animate-ping" />
                            <span className="absolute -inset-1 rounded-2xl bg-[#e8c547]/20 animate-ping" style={{ animationDelay: "0.3s" }} />
                        </>
                    )}

                    {!isOpen && messages.length > 0 && !hasBeenOpened && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#e06b35] border-2 border-[#0d0d0d] text-[9px] text-white flex items-center justify-center font-bold font-mono">
                            1
                        </span>
                    )}

                    {isOpen ? (
                        <X className="w-5 h-5 transition-transform" />
                    ) : (
                        <Bot className="w-6 h-6" />
                    )}
                </button>
            </div>
        </>
    );
}