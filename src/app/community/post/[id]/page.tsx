"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import { fetchMyPostState, fetchPost, type MyPostState, type Post } from "@/lib/posts";
import PostCard from "@/app/components/PostCard";
import CommentsSection from "@/app/components/CommentsSection";

type Result = { key: string; post: Post | null; mine: MyPostState; error: string | null };

const NOTHING_MINE: MyPostState = { liked: new Set(), bookmarked: new Set() };

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const { ready, user } = useAuthUser();
  const userId = user?.id ?? null;

  const raw = params.id;
  const id = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";

  const [result, setResult] = useState<Result | null>(null);
  const key = `${id}|${userId ?? "anon"}`;

  useEffect(() => {
    if (!ready || !id) return;
    let cancelled = false;
    (async () => {
      try {
        const post = await fetchPost(id);
        const mine = post ? await fetchMyPostState([post.id]) : NOTHING_MINE;
        if (!cancelled) setResult({ key, post, mine, error: null });
      } catch (err) {
        if (!cancelled) {
          setResult({
            key,
            post: null,
            mine: NOTHING_MINE,
            error: err instanceof Error ? err.message : "Couldn't load this post.",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, id, key]);

  const loading = !ready || !result || result.key !== key;

  return (
    <main className="min-h-[calc(100vh-60px)] bg-[#0d0d0d] text-[#f0ede6] px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <Link href="/community" className="inline-flex items-center gap-2 text-xs font-mono text-[#888888] hover:text-[#e8c547] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Community
        </Link>

        {loading && (
          <div className="flex items-center justify-center gap-3 py-16 text-[#888888] font-mono text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-[#e8c547]" /> Loading post…
          </div>
        )}

        {!loading && result?.error && <p className="text-sm text-[#e06b35] py-12 text-center">{result.error}</p>}

        {!loading && result && !result.error && !result.post && (
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold mb-2">Post not found</h1>
            <p className="text-sm text-[#888888]">It may have been deleted or removed by a moderator.</p>
          </div>
        )}

        {!loading && result?.post && (
          <>
            <PostCard
              key={key}
              post={result.post}
              currentUserId={userId}
              liked={result.mine.liked.has(result.post.id)}
              bookmarked={result.mine.bookmarked.has(result.post.id)}
              full
              onDeleted={() => router.push("/community")}
            />
            <CommentsSection postId={result.post.id} currentUserId={userId} />
          </>
        )}
      </div>
    </main>
  );
}