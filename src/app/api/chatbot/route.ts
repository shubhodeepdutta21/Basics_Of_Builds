import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { requireUser } from "@/lib/serverAuth";
import { checkRateLimit, tooManyRequests } from "@/lib/rateLimit";

// ── Limits (protect cost and prompt size) ──
const MAX_QUESTION_CHARS = 2000;
const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 4000;
const CHAT_LIMIT = 20;          // messages...
const CHAT_WINDOW_MS = 60_000;  // ...per minute, per user

// ── Small sanitizers: treat every client-supplied field as untrusted ──
const clip = (v: unknown, max: number): string =>
    typeof v === "string" ? v.trim().slice(0, max) : "";

const clipList = (v: unknown, maxItems: number, maxChars: number): string[] =>
    Array.isArray(v)
        ? v
              .filter((x): x is string => typeof x === "string")
              .slice(0, maxItems)
              .map((s) => s.trim().slice(0, maxChars))
              .filter(Boolean)
        : [];

type ChatMessage = { role: "user" | "assistant"; content: string };

function sanitizeHistory(raw: unknown): ChatMessage[] {
    if (!Array.isArray(raw)) return [];
     const out: ChatMessage[] = [];
    for (const m of raw as unknown[]) {
        if (typeof m !== "object" || m === null) continue;
        const { role, content } = m as Record<string, unknown>;
        if ((role === "user" || role === "assistant") && typeof content === "string" && content.trim()) {
            out.push({ role, content: content.slice(0, MAX_MESSAGE_CHARS) });
        }
    }
    return out.slice(-MAX_HISTORY_MESSAGES);
}

export async function POST(request: Request) {
    // 1. Authenticate
    const auth = await requireUser(request);
    if (!auth.ok) return auth.response;

    // 2. Rate limit per user id
    const limited = await checkRateLimit(`chat:${auth.user.id}`, CHAT_LIMIT, CHAT_WINDOW_MS);
    if (!limited.ok) return tooManyRequests(limited.retryAfterSec);

    if (!process.env.GROQ_API_KEY) {
        return NextResponse.json({ error: "AI service is not configured." }, { status: 500 });
    }
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    try {
        // 3. Parse + validate
        const body = await request.json().catch(() => null);
        if (!body || typeof body !== "object") {
            return NextResponse.json({ error: "Invalid request." }, { status: 400 });
        }

        const userQuestion = clip(body.user_question, MAX_QUESTION_CHARS);
        if (!userQuestion) {
            return NextResponse.json({ error: "Question cannot be empty." }, { status: 400 });
        }

        const title = clip(body.active_project_title || body.project_title, 200) || "Hardware Project";
        const description = clip(body.project_description, 1000);
        const difficulty = clip(body.difficulty_level, 50);
        const estimatedTime = clip(body.estimated_time, 50);

        const steps = clipList(body.project_steps, 20, 500);
        const instructionsText =
            steps.length > 0
                ? steps.map((s, i) => `Step ${i + 1}: ${s}`).join("\n")
                : clip(body.project_instructions, 3000) ||
                  "Follow standard hardware prototyping practices: gather parts, verify pinouts, wire safely, and test code.";

        const requirementsText = Array.isArray(body.requirements)
            ? (body.requirements as unknown[])
                  .slice(0, 30)
                  .map((r) => {
                      if (typeof r === "string") return `- ${clip(r, 100)}`;
                      const obj = (r ?? {}) as Record<string, unknown>;
                      const name = clip(obj.name || obj.componentName || obj.componentId, 100) || "Component";
                      const qty = Number(obj.requiredQuantity || obj.quantity) || 1;
                      return `- ${name} (Quantity: ${qty})`;
                  })
                  .join("\n")
            : "";

        const history = sanitizeHistory(body.chat_history);

        const systemPrompt = `You are BOB (Basics Of Builds) AI Technical Assistant, an expert electronics and hardware engineering mentor.
The user is currently building the following DIY hardware project using their inventory components.

--- CURRENT ACTIVE PROJECT BLUEPRINT ---
Project Title: ${title}
${difficulty ? `Difficulty: ${difficulty}` : ""}
${estimatedTime ? `Estimated Time: ${estimatedTime}` : ""}
${description ? `Description: ${description}` : ""}

${requirementsText ? `BILL OF MATERIALS / REQUIRED PARTS:\n${requirementsText}\n` : ""}
ASSEMBLY & BUILD INSTRUCTIONS:
${instructionsText}
--------------------------------------------------

Your task is to help the user assemble, troubleshoot, wire, code, or debug THIS SPECIFIC PROJECT.
Always reference the project's title, components, pinouts, and steps in your answers.
If the user asks questions completely unrelated to DIY hardware or this project, politely steer them back to completing their build.`;

        const messages = [
            { role: "system" as const, content: systemPrompt },
            ...history,
            { role: "user" as const, content: userQuestion },
        ];

        const completion = await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages,
            temperature: 0.3,
            max_completion_tokens: 1500,
            reasoning_effort: "low",
        });

        const reply = completion.choices[0]?.message?.content ?? "";
        if (!reply.trim()) {
            return NextResponse.json({ error: "AI returned an empty response. Please try again." }, { status: 502 });
        }

        return NextResponse.json({ reply });
    } catch (error) {
        // Log the details for yourself; give the client a generic message
        console.error("Groq chatbot error:", error);
        return NextResponse.json(
            { error: "The AI service had a problem. Please try again." },
            { status: 500 }
        );
    }
}