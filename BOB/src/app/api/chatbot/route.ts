import { NextResponse } from "next/server";
import Cerebras from "@cerebras/cerebras_cloud_sdk";

const cerebras= new Cerebras({
    apiKey: process.env.CEREBRAS_API_KEY,
});

export async function POST(request: Request){
    try{
        const{ user_question, active_project_title, project_instructions, chat_history } = await request.json();

        if (!user_question?.trim()){
            return NextResponse.json({ error: "Question cannot be empty." }, {status: 400});
        }
        const systemPrompt = `You are the official AI Technical Assistant for Project BOB (Basics Of Builds).
        The user is currently executing a DIY project using their inventory parts.
        Your task is to help them debug, troubleshoot or clarify assembly steps.
        You must answer using the specific project details provided below. If a question is completely unrelated to this project or DIY hardware, politely steer them back.
        
        --- CURRENT ACTIVE PROJECT: ${active_project_title} ---
        BLUEPRINT INSTRUCTIONS:
        ${project_instructions}
        --------------------------------------------------`

        const messages= [
            {role: "system" as const, content: systemPrompt},
            ...(chat_history || []),
            {role: "user" as const, content: user_question}
        ];

        const completion= await cerebras.chat.completions.create({
            model: "gpt-oss-120b",
            messages: messages,
            temperature: 0.3,
            max_tokens: 800, 
        }) as any;

        return NextResponse.json({
            reply: completion.choices[0].message.content
        });

    } catch (error: any){
        console.error("Native Cerebras SDK Endpoint Error: ", error);
        return NextResponse.json(
            {error: `Inference breakdown: ${error.message || "Unknown error"}`},
            {status: 500}
        );
    }

}