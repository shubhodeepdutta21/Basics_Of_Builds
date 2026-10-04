import { supabase } from "@/lib/supabaseClient";

export type CategoryId = "show_tell" | "help_needed" | "guides";
export type SortId = "latest" | "top";
export type Tab = CategoryId | "all" | "saved";

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "show_tell", label: "Show & Tell" },
  { id: "help_needed", label: "Help Needed" },
  { id: "guides", label: "Guides" },
];

export const categoryLabel = (id: string): string => CATEGORIES.find((c) => c.id === id)?.label ?? id;

export const LIMITS = { titleMin: 3, titleMax: 120, bodyMax: 5000 } as const;
export const PAGE_SIZE = 20;

export type Post = {
  id: string;
  authorId: string;
  authorName: string | null;
  category: CategoryId;
  title: string;
  body: string;
  projectId: string | null;
  likeCount: number;
  commentCount: number;
  createdAt: string;
};

type PostRow = {
  id: string;
  author_id: string;
  category: CategoryId;
  title: string;
  body: string;
  project_id: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  author: { username: string | null } | null;
};

// "author:profiles!posts_author_id_fkey(username)" = join the author's public username
const BASE =
  "id, author_id, category, title, body, project_id, like_count, comment_count, created_at, " +
  "author:profiles!posts_author_id_fkey(username)";

// Joining bookmarks with !inner keeps only posts that have a bookmark row visible to us.
// RLS shows each person only their OWN bookmarks, so this means "posts I saved".
const SAVED = `${BASE}, bookmarks!inner(user_id)`;

const toPost = (r: PostRow): Post => ({
  id: r.id,
  authorId: r.author_id,
  authorName: r.author?.username ?? null,
  category: r.category,
  title: r.title,
  body: r.body,
  projectId: r.project_id,
  likeCount: r.like_count,
  commentCount: r.comment_count,
  createdAt: r.created_at,
});

export async function fetchPosts(opts: {
  tab: Tab;
  sort: SortId;
  search: string;
  before?: string; // latest: created_at of the last post shown (keyset pagination)
  offset?: number; // top: how many posts are already shown
}): Promise<{ posts: Post[]; hasMore: boolean }> {
  let query = supabase
    .from("posts")
    .select(opts.tab === "saved" ? SAVED : BASE)
    .eq("status", "visible");

  if (opts.tab !== "all" && opts.tab !== "saved") query = query.eq("category", opts.tab);

  const term = opts.search.trim();
  if (term) query = query.textSearch("search", term, { type: "websearch", config: "english" });

  // One extra row tells us whether another page exists
  if (opts.sort === "top") {
    const from = opts.offset ?? 0;
    query = query
      .order("like_count", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, from + PAGE_SIZE);
  } else {
    query = query.order("created_at", { ascending: false }).limit(PAGE_SIZE + 1);
    if (opts.before) query = query.lt("created_at", opts.before);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as PostRow[];
  return { posts: rows.slice(0, PAGE_SIZE).map(toPost), hasMore: rows.length > PAGE_SIZE };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function fetchPost(id: string): Promise<Post | null> {
  if (!UUID_RE.test(id)) return null; // a malformed id can't exist; skip the round trip
  const { data, error } = await supabase.from("posts").select(BASE).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toPost(data as unknown as PostRow) : null;
}

export async function createPost(input: {
  category: CategoryId;
  title: string;
  body: string;
  projectId: string | null;
}): Promise<string> {
  const { data, error } = await supabase
    .from("posts")
    .insert({
      category: input.category,
      title: input.title.trim(),
      body: input.body.trim(),
      project_id: input.projectId,
    })
    .select("id")
    .single();

  if (error) {
    // The insert policy rejects people who haven't chosen a username yet
    if (/row-level security/i.test(error.message)) {
      throw new Error("Choose a username on your Account page before posting.");
    }
    throw new Error(error.message);
  }
  return (data as unknown as { id: string }).id;
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── My likes and bookmarks (private: RLS only ever returns the signed-in user's rows) ───
export type MyPostState = { liked: Set<string>; bookmarked: Set<string> };

export async function fetchMyPostState(postIds: string[]): Promise<MyPostState> {
  const state: MyPostState = { liked: new Set(), bookmarked: new Set() };
  if (postIds.length === 0) return state;

  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return state; // signed out: nothing to look up

  const [likes, marks] = await Promise.all([
    supabase.from("post_likes").select("post_id").in("post_id", postIds),
    supabase.from("bookmarks").select("post_id").in("post_id", postIds),
  ]);
  if (likes.error) throw new Error(likes.error.message);
  if (marks.error) throw new Error(marks.error.message);

  for (const r of (likes.data ?? []) as unknown as { post_id: string }[]) state.liked.add(r.post_id);
  for (const r of (marks.data ?? []) as unknown as { post_id: string }[]) state.bookmarked.add(r.post_id);
  return state;
}

// Both calls are idempotent: liking twice (23505 = already exists) is not an error
export async function setPostLiked(postId: string, liked: boolean): Promise<void> {
  const { error } = liked
    ? await supabase.from("post_likes").insert({ post_id: postId })
    : await supabase.from("post_likes").delete().eq("post_id", postId); // RLS limits this to my own row
  if (error && error.code !== "23505") throw new Error(error.message);
}

export async function setPostBookmarked(postId: string, saved: boolean): Promise<void> {
  const { error } = saved
    ? await supabase.from("bookmarks").insert({ post_id: postId })
    : await supabase.from("bookmarks").delete().eq("post_id", postId);
  if (error && error.code !== "23505") throw new Error(error.message);
}