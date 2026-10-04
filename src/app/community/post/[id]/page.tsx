"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import { fetchPost, type Post } from "@/lib/posts";
import PostCard from "@/app/components/PostCard";

type Result = { for: string; post: Post | null; error: string | null };

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthUser();

  const raw = params.id;
  const id = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";

  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchPost(id)
      .then((post) => {
        if (!cancelled) setResult({ for: id, post, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setResult({ for: id, post: null, error: err instanceof Error ? err.message : "Couldn't load this post." });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const loading = !result || result.for !== id;

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
          <PostCard post={result.post} currentUserId={user?.id ?? null} full onDeleted={() => router.push("/community")} />
        )}
      </div>
    </main>
  );
}