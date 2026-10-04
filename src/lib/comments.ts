import { supabase } from "@/lib/supabaseClient";

export const COMMENT_MAX = 1000;

export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  authorName: string | null;
  parentId: string | null;
  body: string;
  createdAt: string;
};

type CommentRow = {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  author: { username: string | null } | null;
};

const SELECT =
  "id, post_id, author_id, parent_id, body, created_at, author:profiles!comments_author_id_fkey(username)";

const toComment = (r: CommentRow): Comment => ({
  id: r.id,
  postId: r.post_id,
  authorId: r.author_id,
  authorName: r.author?.username ?? null,
  parentId: r.parent_id,
  body: r.body,
  createdAt: r.created_at,
});

export async function fetchComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select(SELECT)
    .eq("post_id", postId)
    .eq("status", "visible")
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as CommentRow[]).map(toComment);
}

export async function addComment(input: { postId: string; parentId: string | null; body: string }): Promise<Comment> {
  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: input.postId, parent_id: input.parentId, body: input.body.trim() })
    .select(SELECT)
    .single();

  if (error) {
    if (/row-level security/i.test(error.message)) {
      throw new Error("Choose a username on your Account page before commenting.");
    }
    throw new Error(error.message);
  }
  return toComment(data as unknown as CommentRow);
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}