"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import { useCatalog } from "@/lib/CatalogContext";
import { fetchProfileById } from "@/lib/profile";
import { CATEGORIES, LIMITS, createPost, type CategoryId } from "@/lib/posts";

export default function PostComposer({
  onCreated,
  onCancel,
}: {
  onCreated: (postId: string) => void;
  onCancel: () => void;
}) {
  const { ready, user } = useAuthUser();
  const catalog = useCatalog();

  // undefined = still checking, null = no username yet
  const [username, setUsername] = useState<string | null | undefined>(undefined);
  const [category, setCategory] = useState<CategoryId>("show_tell");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [projectId, setProjectId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchProfileById(userId)
      .then((p) => {
        if (!cancelled) setUsername(p?.username ?? null);
      })
      .catch(() => {
        if (!cancelled) setUsername(null);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const t = title.trim();
    const b = body.trim();
    if (t.length < LIMITS.titleMin) return setError(`Give your post a title of at least ${LIMITS.titleMin} characters.`);
    if (!b) return setError("Write something in the post body.");

    setSaving(true);
    setError("");
    try {
      const id = await createPost({ category, title: t, body: b, projectId: projectId || null });
      onCreated(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't publish your post.");
      setSaving(false);
    }
  };

  const box = "bg-[#161616] border border-[#2a2a2a] rounded-xl p-6";

  if (!ready || (user && username === undefined)) {
    return (
      <div className={`${box} flex items-center gap-3 text-[#888888] text-sm font-mono`}>
        <Loader2 className="w-4 h-4 animate-spin text-[#e8c547]" /> Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className={box}>
        <p className="text-sm mb-4">Sign in to post in the community.</p>
        <Link href="/login" className="px-4 py-2 bg-[#e8c547] hover:bg-[#c4a332] text-[#0d0d0d] font-bold rounded-lg text-sm transition-colors">
          Sign in
        </Link>
      </div>
    );
  }

  if (username === null) {
    return (
      <div className={box}>
        <p className="text-sm mb-4">Choose a public username before posting. It appears on everything you write.</p>
        <Link href="/account" className="px-4 py-2 bg-[#e8c547] hover:bg-[#c4a332] text-[#0d0d0d] font-bold rounded-lg text-sm transition-colors">
          Choose a username
        </Link>
      </div>
    );
  }

  const field =
    "w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#e8c547]";

  return (
    <form onSubmit={handleSubmit} className={`${box} space-y-4`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="post-category" className="block font-mono text-xs text-[#888888] mb-2">Category</label>
          <select id="post-category" value={category} onChange={(e) => setCategory(e.target.value as CategoryId)} className={field}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="post-project" className="block font-mono text-xs text-[#888888] mb-2">Attach a project (optional)</label>
          <select id="post-project" value={projectId} onChange={(e) => setProjectId(e.target.value)} className={field}>
            <option value="">None</option>
            {catalog.projects.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
      </div>

      {category === "show_tell" && (
        <p className="font-mono text-[11px] text-[#888888]">
          Attach the project you built: a Show &amp; Tell post with a project counts as a build on the leaderboard.
        </p>
      )}

      <div>
        <label htmlFor="post-title" className="block font-mono text-xs text-[#888888] mb-2">Title</label>
        <input id="post-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={LIMITS.titleMax} className={field} />
      </div>

      <div>
        <label htmlFor="post-body" className="block font-mono text-xs text-[#888888] mb-2">Post</label>
        <textarea id="post-body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={LIMITS.bodyMax} rows={6} className={`${field} resize-y`} />
        <p className="font-mono text-[11px] text-[#888888] mt-1 text-right">{body.length}/{LIMITS.bodyMax}</p>
      </div>

      {error && (
        <div role="alert" className="text-xs rounded-lg px-4 py-3 border border-[#e06b35]/40 bg-[#e06b35]/10 text-[#e06b35]">
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-[#888888] hover:text-[#f0ede6] transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="px-5 py-2 bg-[#e8c547] hover:bg-[#c4a332] text-[#0d0d0d] font-bold rounded-lg text-sm transition-colors disabled:opacity-50">
          {saving ? "Publishing…" : "Publish"}
        </button>
      </div>
    </form>
  );
}