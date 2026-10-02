import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { parse } from "path";

type Difficulty= "Beginner" | "Intermediate" | "Advanced";

type GeneratedProject = {
    title: string;
    description: string;
    difficultyLevel: Difficulty;
    estimatedTime: string;
    requirements: { name: string; requiredQuantity: number}[];
    steps: string[];
};

const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];

function extractJson(raw: string) : string {
    const trimmed = raw.trim();

    const fenced= trimmed.match(/'''(?:json)?\s*([\s\S]*?)'''/i);
    if (fenced) return fenced[1].trim();

    const start= trimmed.indexOf("{");
    const end= trimmed.lastIndexOf("}");
    if (start !== -1 && end > start) return trimmed.slice(start, end + 1);

    return trimmed;
}

function validateProject(
    data: unknown
): { ok: true; project: GeneratedProject } | { ok: false; reason: string } {
    if (typeof data !== "object" || data == null || Array.isArray(data)){
        return {ok: false, reason: "Response is not a JSON object"};
    }

    const d= data as Record<string, unknown>;

    const title= typeof d.title == "string" ? d.title.trim() : "";
    const description= typeof d.description == "string" ? d.description.trim() : "";
    if (!title) return {ok:false, reason: "Missing Title"};
    if (!description) return {ok: false, reason: "Missing Description"};

    const steps= Array.isArray(d.steps)
        ? d.steps
            .filter((s): s is string => typeof s == "string")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
    if (steps.length < 2) return {ok: false, reason: "Fewer than 2 build steps"};

    const requirements= Array.isArray(d.requirements)
        ? d.requirements
            .map((r) => {
                if (typeof r === "string") return {name: r.trim(), requiredQuantity: 1};
                if (r && typeof r === "object") {
                    const obj= r as Record<string, unknown>;
                    const name= typeof obj.name === "string" ? obj.name.trim() : "";
                    const qty= Number(obj.requiredQuantity);
                    return {
                        name,
                        requiredQuantity: Number.isFinite(qty) && qty >= 1 ? Math.floor(qty) : 1,
                    };
                }
                return {name: "", requiredQuantity: 1};
            })
            .filter((r) => r.name.length > 0)
        : [];

    const difficultyLevel: Difficulty= DIFFICULTIES.includes(d.difficultyLevel as Difficulty)
            ? (d.difficultyLevel as Difficulty)
            : "Intermediate";

    const estimatedTime = 
        typeof d.estimatedTime == "string" && d.estimatedTime.trim() ? d.estimatedTime.trim() : "2 Hours";
    
    return {
        ok:true,
        project: { title, description, difficultyLevel, estimatedTime, requirements, steps },
    };
}

export async function POST(request: Request) {

    if (!process.env.GROQ_API_KEY) {
        return NextResponse.json(
            { error: "GROQ_API_KEY is not set" },
            { status: 500 }
        );
    }

    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

    try {
        const body = await request.json();
        const { componentNames, inventory } = body;

        let partsList: string[] = [];

        if (Array.isArray(componentNames) && componentNames.length > 0) {
            partsList = componentNames.map(item => {
                if (typeof item === 'string') return item;
                if (item && typeof item === 'object') {
                    const qtyStr = item.quantity && item.quantity > 1 ? `${item.quantity}x ` : '';
                    return `${qtyStr}${item.name || item.title || 'Component'}`;
                }
                return String(item);
            });
        } else if (Array.isArray(inventory) && inventory.length > 0) {
            partsList = inventory.map(item => {
                if (typeof item === 'string') return item;
                if (item && typeof item === 'object') {
                    const qtyStr = item.quantity && item.quantity > 1 ? `${item.quantity}x ` : '';
                    return `${qtyStr}${item.name || item.componentName || item.componentId || 'Component'}`;
                }
                return String(item);
            });
        }

        if (partsList.length === 0) {
            return NextResponse.json({ error: "No inventory provided. Please add parts to your inventory first." }, { status: 400 });
        }

        const prompt = `
      You are an expert electronics engineering mentor. 
      The student has the following EXACT list of components and parts in their inventory:
      ${partsList.map(p => `- ${p}`).join("\n")}

      Suggest and invent a creative, safe, practical, and fully working DIY hardware project that they can build using ONLY some or all of these available inventory parts.

      You MUST respond with a pure, valid JSON object in this exact format (no markdown, no backticks, just the JSON):
      {
        "title": "Catchy name for the project",
        "description": "A 2-3 sentence explanation of what it does and why it's cool",
        "difficultyLevel": "Beginner, Intermediate, or Advanced",
        "estimatedTime": "e.g., 2 Hours",
        "requirements": [
          { "name": "Component Name", "requiredQuantity": 1 }
        ],
        "steps": [
          "Step 1...",
          "Step 2...",
          "Step 3..."
        ]
      }
    `;

        const response = (await client.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [{ role: "user", content: prompt }],
            max_completion_tokens: 2048,
            reasoning_effort: "low",
            response_format: { type: "json_object" },
        } as any)) as any;

        const content = response.choices?.[0]?.message?.content ?? "";

        if (!content.trim()) {
            console.error("AI returned empty content. finish_reason:", response.choices?.[0]?.finish_reason);
            return NextResponse.json(
                {error: "AI returned an empty response. Please try again."},
                {status: 502}
            );
        }

        let parsed: unknown;
        try{
            parsed= JSON.parse(extractJson(content));
        } catch (e) {
            console.error("Failed to parse AI response.", e, "\nRaw:", content);
            return NextResponse.json(
                { error: "AI returned malformed JSON. Please try again." },
                {status: 502}
            );
        }

        const result= validateProject(parsed);
        if (!result.ok){
            console.error("AI project failed validation:", result.reason, "\nParsed:", parsed);
            return NextResponse.json(
                {error: `AI returned an incomplete project (${result.reason}). Please try again.`},
                {status: 502}
            );
        }
        
        return NextResponse.json({project: result.project});
    } catch (error) {
        console.error("AI Generation Error:", error);
        return NextResponse.json({error: "Failed to generate project"}, {status: 500});
    }
}