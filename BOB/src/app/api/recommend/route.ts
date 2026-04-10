import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function POST(request: Request) {
    try {
        // 1. Get the user's inventory from the frontend request
        // This will be an array of component IDs they own, like: ['1', '3', '5']
        const body = await request.json();
        const userInventoryIds = body.inventory || [];

        // 2. Fetch all projects AND their requirements in one go! ✨
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

        // 3. The Brain! 🧠 Calculate the match percentage for each project
        const recommendations = projects.map((project) => {
            const reqs = project.project_requirements;

            // If a project has no requirements, it's a 100% match!
            if (!reqs || reqs.length === 0) return { ...project, matchPercentage: 100 };

            // Check how many of the required components the user actually owns
            const matchedCount = reqs.filter((req) =>
                userInventoryIds.includes(req.component_id)
            ).length;

            // Calculate the score (e.g., 3 out of 4 items = 75%)
            const matchPercentage = Math.round((matchedCount / reqs.length) * 100);

            // Find exactly what they need to buy to finish it
            const missingComponents = reqs.filter((req) =>
                !userInventoryIds.includes(req.component_id)
            );

            return {
                ...project,
                matchPercentage,
                missingComponents
            };
        });

        // 4. Sort the projects so the 100% matches are right at the very top! 🏆
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