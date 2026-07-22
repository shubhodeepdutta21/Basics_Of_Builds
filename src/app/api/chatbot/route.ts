import { NextResponse } from "next/server";
import Cerebras from "@cerebras/cerebras_cloud_sdk";

const cerebras= new Cerebras({
    apiKey: process.env.CEREBRAS_API_KEY,
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            user_question,
            active_project_title,
            project_title,
            project_description,
            project_instructions,
            project_steps,
            difficulty_level,
            estimated_time,
            requirements,
            chat_history,
        } = body;

        if (!user_question?.trim()) {
            return NextResponse.json({ error: "Question cannot be empty." }, { status: 400 });
        }

        const title = active_project_title || project_title || "Hardware Project";

        let instructionsText = "";
        if (Array.isArray(project_steps) && project_steps.length > 0) {
            instructionsText = project_steps.map((step: string, i: number) => `Step ${i + 1}: ${step}`).join("\n");
        } else if (project_instructions) {
            instructionsText = project_instructions;
        } else {
            instructionsText = "Follow standard hardware prototyping practices: gather parts, verify pinouts, wire safely, and test code.";
        }

        let requirementsText = "";
        if (Array.isArray(requirements) && requirements.length > 0) {
            requirementsText = requirements.map((r: any) => {
                if (typeof r === 'string') return `- ${r}`;
                const name = r.name || r.componentName || r.componentId || 'Component';
                const qty = r.requiredQuantity || r.quantity || 1;
                return `- ${name} (Quantity: ${qty})`;
            }).join("\n");
        }

        const systemPrompt = `You are BOB (Basics Of Builds) AI Technical Assistant, an expert electronics and hardware engineering mentor.
The user is currently building the following DIY hardware project using their inventory components.

--- CURRENT ACTIVE PROJECT BLUEPRINT ---
Project Title: ${title}
${difficulty_level ? `Difficulty: ${difficulty_level}` : ""}
${estimated_time ? `Estimated Time: ${estimated_time}` : ""}
${project_description ? `Description: ${project_description}` : ""}

${requirementsText ? `BILL OF MATERIALS / REQUIRED PARTS:\n${requirementsText}\n` : ""}
ASSEMBLY & BUILD INSTRUCTIONS:
${instructionsText}
--------------------------------------------------

Your task is to help the user assemble, troubleshoot, wire, code, or debug THIS SPECIFIC PROJECT.
Always reference the project's title, components, pinouts, and steps in your answers.
If the user asks questions completely unrelated to DIY hardware or this project, politely steer them back to completing their build.`;

        const messages = [
            { role: "system" as const, content: systemPrompt },
            ...(chat_history || []),
            { role: "user" as const, content: user_question }
        ];

        const completion = await cerebras.chat.completions.create({
            model: "gpt-oss-120b",
            messages: messages,
            temperature: 0.3,
            max_tokens: 800,
        }) as any;

        return NextResponse.json({
            reply: completion.choices[0].message.content
        });

    } catch (error: any) {
        console.error("Native Cerebras SDK Endpoint Error: ", error);
        return NextResponse.json(
            { error: `Inference breakdown: ${error.message || "Unknown error"}` },
            { status: 500 }
        );
    }
}