import { supabase } from "./supabaseClient";

export type CategoryId= "show_tell" | "help_needed" | "guides";

export const CATEGORIES: {id: CategoryId; label: string}[] = [
    {id: "show_tell", label: "Show & Tell"},
    {id: "help_needed", label: "Help Needed"},
    {id: "guides", label: "Guides"},
];

export const categoryLabel= (id: string): string => CATEGORIES.find((c) => c.id === id)?.label ?? id;

export const LIMITS= {titleMin: 3, titleMax: 120, bodyMax: 5000} as const;
export const PAGE_SIZE= 20;

export type Post = {
    id: string;
    authorId: string;
    authorName: string | null;
    category: CategoryId;
    title: string;
    body: string;
    projectId: string | null;
    createdAt: string;
};

type PostRow = {
    id: string;
    author_id: string;
    category: CategoryId;
    title: string;
    body: string;
    project_id: string | null;
    created_at: string;
    author: {username: string | null} | null;
};

const SELECT= "id, author_id, category, title, body, project_id, created_at, author:profiles!posts_author_id_fkey(username)";

const toPost= (r: PostRow): Post => ({
    id: r.id,
    authorId: r.author_id,
    authorName: r.author?.username ?? null,
    category: r.category,
    title: r.title,
    body: r.body,
    projectId: r.project_id,
    createdAt: r.created_at,
});

export async function fetchPosts(opts: {
    category: CategoryId | "all";
    search: string;
    before?: string;
}): Promise<{posts: Post[]; hasMore: boolean}> {

    let query= supabase.from("posts").select(SELECT).eq("status", "visible").order("created_at", {ascending: false}).limit(PAGE_SIZE + 1);
    
    if (opts.category != "all") query= query.eq("category", opts.category);

    const term= opts.search.trim();
    if (term) query= query.textSearch("search", term, {type: "websearch", config: "english"});

    if (opts.before) query= query.lt("created_at", opts.before);

    const {data, error}= await query;
    if (error) throw new Error(error.message);

    const rows= (data ?? []) as unknown as PostRow[];
    return {posts: rows.slice(0, PAGE_SIZE).map(toPost), hasMore: rows.length > PAGE_SIZE};
}

const UUID_RE= /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function fetchPost(id: string): Promise<Post | null> {
    if (!UUID_RE.test(id)) return null;
    const {data, error}= await supabase.from("posts").select(SELECT).eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toPost(data as unknown as PostRow) : null;
}

export async function createPost(input: {
    category: CategoryId;
    title: string;
    body: string;
    projectId: string | null;
}): Promise<string> {
    const {data, error}= await supabase.from("posts").insert({
        category: input.category,
        title: input.title.trim(),
        body: input.body.trim(),
        project_id: input.projectId,
    }).select("id").single();

    if (error) {
        if (/row-level security/i.test(error.message)) {
            throw new Error("Choose a username on your Account page before posting.");
        }
        throw new Error(error.message);
    }
    return (data as unknown as {id: string}).id;
}

export async function deletePost(id: string): Promise<void> {
    const {error}= await supabase.from("posts").delete().eq("id", id);
    if (error) throw new Error(error.message);
}