import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function POST(request: Request) {
    try {
        // 1. Get the user's inventory from the frontend request
        const body = await request.json();
        const rawInventory = body.inventory || body.componentIds || [];

        // Extract component IDs as string array regardless of object vs string format
        const userInventoryIds = rawInventory.map((item: any) => {
            if (typeof item === 'object' && item !== null) {
                return String(item.componentId || item.id || '');
            }
            return String(item);
        }).filter(Boolean);

        // 2. Fetch all projects AND their requirements
        const { data: projects, error } = await supabase
            .from("projects")
            .select(`
        id, 
        title, 
        description, 
        difficulty_level, 
        estimated_time,
        project_requirements (
          component_id, required_quantity, is_optional
        )
      `);

        if (error) throw error;

        // 3. Calculate match percentage for each project using string matching
        const recommendations = projects.map((project) => {
            const reqs = project.project_requirements;

            if (!reqs || reqs.length === 0) return { ...project, matchPercentage: 100 };

            const matchedCount = reqs.filter((req) =>
                userInventoryIds.includes(String(req.component_id))
            ).length;

            const matchPercentage = Math.round((matchedCount / reqs.length) * 100);

            const missingComponents = reqs.filter((req) =>
                !userInventoryIds.includes(String(req.component_id))
            );

            return {
                ...project,
                matchPercentage,
                missingComponents
            };
        });

        // 4. Sort recommendations by highest match
        recommendations.sort((a, b) => b.matchPercentage - a.matchPercentage);

        return NextResponse.json({ recommendations });

    } catch (error) {
        console.error("Recommendation error:", error);
        return NextResponse.json(
            { error: "Failed to generate recommendations" },
            { status: 500 }
        );
    }
}