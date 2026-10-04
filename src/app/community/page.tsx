"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Search } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import { CATEGORIES, fetchMyPostState, fetchPosts, type MyPostState, type Post, type SortId, type Tab } from "@/lib/posts";
import PostCard from "@/app/components/PostCard";
import PostComposer from "@/app/components/PostComposer";

type FeedResult = {
  key: string;
  posts: Post[];
  hasMore: boolean;
  mine: MyPostState; // which of these posts I liked / saved
  error: string | null;
};

const NOTHING_MINE: MyPostState = { liked: new Set(), bookmarked: new Set() };

export default function CommunityPage() {
  const router = useRouter();
  const { ready, user } = useAuthUser();
  const userId = user?.id ?? null;

  const [tab, setTab] = useState<Tab>("all");
  const [sort, setSort] = useState<SortId>("latest");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [composerOpen, setComposerOpen] = useState(false);

  const [result, setResult] = useState<FeedResult | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState("");

  // Identifies "which feed is on screen". The signed-in user is part of it, because
  // "which posts did I like" changes when someone signs in or out.
  const key = `${tab}|${sort}|${search}|${reloadKey}|${userId ?? "anon"}`;

  useEffect(() => {
    if (!ready) return; // wait until we know who is looking
    let cancelled = false;
    (async () => {
      try {
        const { posts, hasMore } = await fetchPosts({ tab, sort, search });
        const mine = await fetchMyPostState(posts.map((p) => p.id));
        if (!cancelled) setResult({ key, posts, hasMore, mine, error: null });
      } catch (err) {
        if (!cancelled) {
          setResult({
            key,
            posts: [],
            hasMore: false,
            mine: NOTHING_MINE,
            error: err instanceof Error ? err.message : "Couldn't load posts.",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, tab, sort, search, key]);

  const loading = !ready || !result || result.key !== key;

  const loadMore = async () => {
    if (!result || loading || loadingMore || !result.hasMore) return;
    const last = result.posts[result.posts.length - 1];
    setLoadingMore(true);
    setMoreError("");
    try {
      const more = await fetchPosts({
        tab,
        sort,
        search,
        before: last.createdAt,
        offset: result.posts.length,
      });
      const mine = await fetchMyPostState(more.posts.map((p) => p.id));
      setResult((prev) => {
        if (!prev || prev.key !== key) return prev;
        const seen = new Set(prev.posts.map((p) => p.id));
        return {
          ...prev,
          posts: [...prev.posts, ...more.posts.filter((p) => !seen.has(p.id))], // never show a post twice
          hasMore: more.hasMore,
          mine: {
            liked: new Set([...prev.mine.liked, ...mine.liked]),
            bookmarked: new Set([...prev.mine.bookmarked, ...mine.bookmarked]),
          },
        };
      });
    } catch (err) {
      setMoreError(err instanceof Error ? err.message : "Couldn't load more posts.");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const handleDeleted = (id: string) => {
    setResult((prev) => (prev ? { ...prev, posts: prev.posts.filter((p) => p.id !== id) } : prev));
  };

  const tabClass = (active: boolean) =>
    `px-3 py-1.5 rounded-md text-sm transition-all ${
      active ? "bg-[#1f1f1f] text-[#f0ede6] font-medium" : "text-[#888888] hover:text-[#f0ede6] hover:bg-[#161616]"
    }`;

  // If someone signs out while looking at "Saved", show everything instead of an empty list
  const activeTab: Tab = tab === "saved" && !userId && ready ? "all" : tab;

  return (
    <main className="min-h-[calc(100vh-60px)] bg-[#0d0d0d] text-[#f0ede6] px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="font-mono text-xs tracking-[3px] text-[#e06b35] uppercase mb-2">Community</p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Makers talking builds</h1>
          </div>
          {!composerOpen && (
            <button
              onClick={() => setComposerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#e8c547] hover:bg-[#c4a332] text-[#0d0d0d] font-bold rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> New post
            </button>
          )}
        </div>

        {composerOpen && (
          <div className="mb-8">
            <PostComposer onCreated={(id) => router.push(`/community/post/${id}`)} onCancel={() => setComposerOpen(false)} />
          </div>
        )}

        <div className="flex flex-wrap gap-1 mb-4">
          <button onClick={() => setTab("all")} className={tabClass(activeTab === "all")}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setTab(c.id)} className={tabClass(activeTab === c.id)}>
              {c.label}
            </button>
          ))}
          {userId && (
            <button onClick={() => setTab("saved")} className={tabClass(activeTab === "saved")}>
              Saved
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search posts…"
              aria-label="Search posts"
              className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#e8c547]"
            />
          </form>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortId)}
            aria-label="Sort posts"
            className="bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#e8c547]"
          >
            <option value="latest">Latest</option>
            <option value="top">Top (most liked)</option>
          </select>
        </div>

        {search && (
          <p className="font-mono text-xs text-[#888888] mb-4">
            Results for &ldquo;{search}&rdquo;{" "}
            <button
              onClick={() => {
                setSearch("");
                setSearchInput("");
              }}
              className="text-[#e8c547] hover:underline"
            >
              clear
            </button>
          </p>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-3 py-16 text-[#888888] font-mono text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-[#e8c547]" /> Loading posts…
          </div>
        )}

        {!loading && result?.error && (
          <div className="text-center py-12">
            <p className="text-sm text-[#e06b35] mb-4">{result.error}</p>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="px-4 py-2 bg-[#e8c547] hover:bg-[#c4a332] text-[#0d0d0d] font-bold rounded-lg text-sm transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && result && !result.error && result.posts.length === 0 && (
          <p className="text-center py-16 text-sm text-[#888888]">
            {search
              ? "No posts match your search."
              : activeTab === "saved"
                ? "You haven't saved any posts yet."
                : "No posts here yet. Be the first to share a build."}
          </p>
        )}

        {!loading && result && result.posts.length > 0 && (
          <div className="space-y-4">
            {result.posts.map((post) => (
              <PostCard
                // userId in the key: a fresh card (with fresh like/save state) after sign-in or sign-out
                key={`${post.id}:${userId ?? "anon"}`}
                post={post}
                currentUserId={userId}
                liked={result.mine.liked.has(post.id)}
                bookmarked={result.mine.bookmarked.has(post.id)}
                onDeleted={handleDeleted}
              />
            ))}

            {moreError && <p role="alert" className="text-xs text-[#e06b35] text-center">{moreError}</p>}

            {result.hasMore && (
              <div className="text-center pt-2">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-5 py-2 border border-[#3a3a3a] hover:border-[#e8c547] text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}