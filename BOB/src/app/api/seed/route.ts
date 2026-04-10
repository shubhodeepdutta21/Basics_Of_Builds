import { NextResponse } from "next/server";
import { supabase } from "@/lib/db"; // Make sure this path points to your new Supabase client!
import { MOCK_COMPONENTS, MOCK_PROJECTS } from "@/lib/mockData";

export async function POST() {
    try {
        // 1. Insert Components
        // We map over them to match your SQL snake_case column names!
        const componentsToInsert = MOCK_COMPONENTS.map((c) => ({
            id: c.id,
            name: c.name,
            category: c.category,
            description: c.description,
            image_url: c.imageUrl,
        }));

        // 'upsert' safely inserts or updates if the ID already exists!
        const { error: compError } = await supabase
            .from("components")
            .upsert(componentsToInsert);

        if (compError) throw compError;

        // 2. Insert Projects & their Requirements
        for (const proj of MOCK_PROJECTS) {

            // Insert the main project details
            const { error: projError } = await supabase.from("projects").upsert({
                id: proj.id,
                title: proj.title,
                description: proj.description,
                difficulty_level: proj.difficultyLevel,
                estimated_time: proj.estimatedTime,
            });

            if (projError) throw projError;

            // Insert the bridge table requirements
            const requirementsToInsert = proj.requirements.map((req) => ({
                project_id: proj.id,
                component_id: req.componentId,
                required_quantity: req.requiredQuantity,
                is_optional: req.isOptional,
            }));

            const { error: reqError } = await supabase
                .from("project_requirements")
                .upsert(requirementsToInsert);

            if (reqError) throw reqError;
        }

        return NextResponse.json({ message: "Supabase seeded perfectly! 🌸✨" });
    } catch (error) {
        console.error("Seeding error:", error);
        return NextResponse.json(
            { error: "Failed to seed Supabase database" },
            { status: 500 }
        );
    }
}