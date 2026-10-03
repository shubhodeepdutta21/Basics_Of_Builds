import { supabase } from "./supabaseClient";
import { CatalogComponent, CatalogProject } from "./types";

type ComponentRow = {
  id: string;
  name: string;
  category: string;
  description: string | null;
};

type RequirementRow = {
  component_id: string;
  required_quantity: number;
  is_optional: boolean | null;
};

type ProjectRow = {
  id: string;
  title: string;
  description: string;
  difficulty_level: string | null;
  estimated_time: string | null;
  steps: string[] | null;
  project_requirements: RequirementRow[] | null;
};

export async function fetchCatalog(): Promise<{components: CatalogComponent[]; projects: CatalogProject[];}> {
    const [compRes, projRes]= await Promise.all([
        supabase.from("components").select("id, name, category, description").order("name"),
        supabase.from("projects").select("id, title, description, difficulty_level, estimated_time, steps, " + "project_requirements(component_id, required_quantity, is_optional)").order("title"),
    ]);

    if (compRes.error) throw new Error(`Couldn't load parts: ${compRes.error.message}`);
    if (projRes.error) throw new Error(`Couldn't load projects: ${projRes.error.message}`);

    const componentRows= (compRes.data ?? []) as unknown as ComponentRow[];
    const projectRows= (projRes.data ?? []) as unknown as ProjectRow[];

    if (componentRows.length === 0) {
        throw new Error("The parts catalog came back empty. Check that the components table has rows and a public read policy.");
    }

    const components: CatalogComponent[]= componentRows.map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        description: r.description ?? "",
    }));

    const projects: CatalogProject[]= projectRows.map((r)=> ({
        id: r.id,
        title: r.title,
        description: r.description,
        difficultyLevel: r.difficulty_level ?? "Intermediate",
        estimatedTime: r.estimated_time ?? "",
        steps: r.steps ?? [],
        requirements: (r.project_requirements ?? []).map((q) => ({
            componentId: q.component_id,
            requiredQuantity: q.required_quantity,
            isOptional: q.is_optional ?? false,
        })),
    }));

    return {components, projects};
}