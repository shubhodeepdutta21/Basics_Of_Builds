"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Bookmark, Heart, MessageSquare, Share2, Trash2, Wrench } from "lucide-react";
import { useCatalog } from "@/lib/CatalogContext";
import { categoryLabel, deletePost, setPostBookmarked, setPostLiked, type Post } from "@/lib/posts";
import { timeAgo } from "@/lib/format";

const PREVIEW_CHARS = 280;

export default function PostCard({
  post,
  currentUserId,
  liked: initialLiked = false,
  bookmarked: initialBookmarked = false,
  full = false,
  onDeleted,
}: {
  post: Post;
  currentUserId: string | null;
  liked?: boolean;
  bookmarked?: boolean;
  full?: boolean;
  onDeleted?: (id: string) => void;
}) {
  const catalog = useCatalog();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // Local, optimistic copies: the screen updates instantly, the save happens in the background
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [busy, setBusy] = useState(false);

  const project = post.projectId ? catalog.projects.find((p) => p.id === post.projectId) : undefined;
  const isOwner = currentUserId !== null && currentUserId === post.authorId;
  const truncated = !full && post.body.length > PREVIEW_CHARS;
  const bodyText = truncated ? `${post.body.slice(0, PREVIEW_CHARS).trimEnd()}…` : post.body;

  const needsSignIn = () => {
    if (currentUserId) return false;
    setError("Sign in to like and save posts.");
    return true;
  };

  const toggleLike = async () => {
    if (needsSignIn() || busy) return;
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => Math.max(0, c + (next ? 1 : -1)));
    setBusy(true);
    setError("");
    try {
      await setPostLiked(post.id, next);
    } catch (err) {
      // Save failed: put the screen back the way it was
      setLiked(!next);
      setLikeCount((c) => Math.max(0, c + (next ? -1 : 1)));
      setError(err instanceof Error ? err.message : "Couldn't save your like.");
    } finally {
      setBusy(false);
    }
  };

  const toggleBookmark = async () => {
    if (needsSignIn() || busy) return;
    const next = !bookmarked;
    setBookmarked(next);
    setBusy(true);
    setError("");
    try {
      await setPostBookmarked(post.id, next);
    } catch (err) {
      setBookmarked(!next);
      setError(err instanceof Error ? err.message : "Couldn't save the bookmark.");
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/community/post/${post.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy the link. Copy it from the address bar on the post page.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    try {
      await deletePost(post.id);
      onDeleted?.(post.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete the post.");
    }
  };

  const action = "flex items-center gap-1.5 text-[#888888] transition-colors";

  return (
    <article className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
      <div className="flex flex-wrap items-center gap-2 mb-3 font-mono text-[11px] text-[#888888]">
        <span className="px-2 py-0.5 rounded border border-[#3a3a3a] bg-[#1f1f1f] text-[#e8c547]">
          {categoryLabel(post.category)}
        </span>
        {post.authorName ? (
          <Link href={`/u/${post.authorName}`} className="hover:text-[#e8c547] transition-colors">
            @{post.authorName}
          </Link>
        ) : (
          <span>unknown maker</span>
        )}
        <span>· {timeAgo(post.createdAt)}</span>
      </div>

      <h2 className="text-xl font-bold tracking-tight mb-2">
        {full ? (
          post.title
        ) : (
          <Link href={`/community/post/${post.id}`} className="hover:text-[#e8c547] transition-colors">
            {post.title}
          </Link>
        )}
      </h2>

      <p className="text-sm text-[#d6d3cc] leading-relaxed whitespace-pre-wrap wrap-break-word">{bodyText}</p>

      {truncated && (
        <Link href={`/community/post/${post.id}`} className="inline-block mt-2 text-xs font-mono text-[#e8c547] hover:underline">
          Read more →
        </Link>
      )}

      {project && (
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-md border border-[#3a3a3a] bg-[#1f1f1f] text-xs font-mono text-[#f0ede6] hover:border-[#e8c547] transition-colors"
        >
          <Wrench className="w-3.5 h-3.5 text-[#e8c547]" /> {project.title}
        </Link>
      )}

      <div className="flex flex-wrap items-center gap-5 mt-5 pt-4 border-t border-[#2a2a2a] text-xs font-mono">
        <button
          onClick={toggleLike}
          aria-pressed={liked}
          aria-label={liked ? "Unlike" : "Like"}
          className={`${action} ${liked ? "text-rose-400" : "hover:text-rose-400"}`}
        >
          <Heart className={`w-4 h-4 ${liked ? "fill-rose-400" : ""}`} /> {likeCount}
        </button>

        {!full && (
          <Link href={`/community/post/${post.id}#comments`} className={`${action} hover:text-[#e8c547]`}>
            <MessageSquare className="w-4 h-4" /> {post.commentCount}
          </Link>
        )}

        <button
          onClick={toggleBookmark}
          aria-pressed={bookmarked}
          aria-label={bookmarked ? "Remove bookmark" : "Save post"}
          className={`${action} ${bookmarked ? "text-[#e8c547]" : "hover:text-[#e8c547]"}`}
        >
          <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-[#e8c547]" : ""}`} /> {bookmarked ? "Saved" : "Save"}
        </button>

        <button onClick={handleShare} className={`${action} hover:text-[#e8c547]`}>
          <Share2 className="w-4 h-4" /> {copied ? "Link copied" : "Share"}
        </button>

        {isOwner && (
          <button onClick={handleDelete} className={`${action} hover:text-rose-400 ml-auto`}>
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs text-[#e06b35]">
          {error}
        </p>
      )}
    </article>
  );
}