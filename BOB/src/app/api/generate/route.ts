import { NextResponse } from "next/server";
import Cerebras from "@cerebras/cerebras_cloud_sdk";


export async function POST(request: Request) {
    const client = new Cerebras({ apiKey: process.env.CEREBRAS_API_KEY });

    if (!process.env.CEREBRAS_API_KEY) {
        return NextResponse.json(
            { error: "CEREBRAS_API_KEY is not set" },
            { status: 500 }
        );
    }

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

        const response = await client.chat.completions.create({
            model: "gpt-oss-120b",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1024,
            response_format: { type: "json_object" } as any,
        }) as any;

        const content = response.choices?.[0]?.message?.content ?? "";

        let generatedProject = {};
        try {
            generatedProject = JSON.parse(content || "{}");
        } catch (e) {
            console.error("Failed to parse AI response:", e);
            return NextResponse.json(
                { error: "AI returned malformed JSON. Please try again." },
                { status: 500 }
            );
        }

        return NextResponse.json({ project: generatedProject });

    } catch (error) {
        console.error("AI Generation Error:", error);
        return NextResponse.json({ error: "Failed to generate project" }, { status: 500 });
    }
}