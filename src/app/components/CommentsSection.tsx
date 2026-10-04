"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";
import { COMMENT_MAX, addComment, deleteComment, fetchComments, type Comment } from "@/lib/comments";
import { timeAgo } from "@/lib/format";

type Loaded = { postId: string; comments: Comment[]; error: string | null };

// A textarea + submit button, used for both new comments and replies
function CommentForm({
  placeholder,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  placeholder: string;
  submitLabel: string;
  onSubmit: (body: string) => Promise<void>;
  onCancel?: () => void;
}) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || saving) return;

    setSaving(true);
    setError("");
    try {
      await onSubmit(body);
      setText("");
      onCancel?.(); // closes a reply box after a successful reply
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't post your comment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={COMMENT_MAX}
        rows={3}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#e8c547] resize-y"
      />
      {error && (
        <p role="alert" className="text-xs text-[#e06b35]">
          {error}
        </p>
      )}
      <div className="flex items-center justify-end gap-3">
        <span className="font-mono text-[11px] text-[#888888] mr-auto">{text.length}/{COMMENT_MAX}</span>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-xs text-[#888888] hover:text-[#f0ede6] transition-colors">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving || !text.trim()}
          className="px-4 py-1.5 bg-[#e8c547] hover:bg-[#c4a332] text-[#0d0d0d] font-bold rounded-lg text-xs transition-colors disabled:opacity-50"
        >
          {saving ? "Posting…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default function CommentsSection({
  postId,
  currentUserId,
}: {
  postId: string;
  currentUserId: string | null;
}) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchComments(postId)
      .then((comments) => {
        if (!cancelled) setLoaded({ postId, comments, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoaded({ postId, comments: [], error: err instanceof Error ? err.message : "Couldn't load comments." });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const loading = !loaded || loaded.postId !== postId;
  const comments = loaded && loaded.postId === postId ? loaded.comments : [];

  const append = (c: Comment) =>
    setLoaded((prev) => (prev && prev.postId === postId ? { ...prev, comments: [...prev.comments, c] } : prev));

  const handleDelete = async (c: Comment, replyCount: number) => {
    const warning = replyCount > 0 ? "Delete this comment and its replies?" : "Delete this comment?";
    if (!window.confirm(warning)) return;
    setActionError("");
    try {
      await deleteComment(c.id);
      // Remove the comment and (for a top-level comment) its replies
      setLoaded((prev) =>
        prev ? { ...prev, comments: prev.comments.filter((x) => x.id !== c.id && x.parentId !== c.id) } : prev
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't delete the comment.");
    }
  };

  const topLevel = comments.filter((c) => c.parentId === null);
  const repliesOf = (id: string) => comments.filter((c) => c.parentId === id);

  const renderComment = (c: Comment, replyCount: number, isReply: boolean) => (
    <div key={c.id} className={isReply ? "pl-5 border-l border-[#2a2a2a]" : ""}>
      <div className="flex items-center gap-2 font-mono text-[11px] text-[#888888] mb-1">
        {c.authorName ? (
          <Link href={`/u/${c.authorName}`} className="text-[#f0ede6] hover:text-[#e8c547] transition-colors">
            @{c.authorName}
          </Link>
        ) : (
          <span>unknown maker</span>
        )}
        <span>· {timeAgo(c.createdAt)}</span>
      </div>
      <p className="text-sm text-[#d6d3cc] leading-relaxed whitespace-pre-wrap break-words">{c.body}</p>
      <div className="flex gap-4 mt-1 font-mono text-[11px]">
        {!isReply && currentUserId && (
          <button
            onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
            className="text-[#888888] hover:text-[#e8c547] transition-colors"
          >
            Reply
          </button>
        )}
        {currentUserId === c.authorId && (
          <button
            onClick={() => handleDelete(c, replyCount)}
            className="flex items-center gap-1 text-[#888888] hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        )}
      </div>

      {replyingTo === c.id && (
        <div className="mt-3 pl-5">
          <CommentForm
            placeholder={`Reply to @${c.authorName ?? "maker"}…`}
            submitLabel="Reply"
            onSubmit={async (body) => append(await addComment({ postId, parentId: c.id, body }))}
            onCancel={() => setReplyingTo(null)}
          />
        </div>
      )}
    </div>
  );

  return (
    <section id="comments" className="mt-10">
      <h2 className="text-lg font-bold mb-4">Comments{!loading && ` (${comments.length})`}</h2>

      <div className="mb-6">
        {currentUserId ? (
          <CommentForm
            placeholder="Add a comment…"
            submitLabel="Comment"
            onSubmit={async (body) => append(await addComment({ postId, parentId: null, body }))}
          />
        ) : (
          <p className="text-sm text-[#888888]">
            <Link href="/login" className="text-[#e8c547] hover:underline">Sign in</Link> to join the conversation.
          </p>
        )}
      </div>

      {actionError && (
        <p role="alert" className="text-xs text-[#e06b35] mb-4">
          {actionError}
        </p>
      )}

      {loading && (
        <div className="flex items-center gap-3 text-[#888888] font-mono text-sm py-6">
          <Loader2 className="w-4 h-4 animate-spin text-[#e8c547]" /> Loading comments…
        </div>
      )}

      {!loading && loaded?.error && <p className="text-sm text-[#e06b35]">{loaded.error}</p>}

      {!loading && !loaded?.error && comments.length === 0 && (
        <p className="text-sm text-[#888888]">No comments yet. Start the conversation.</p>
      )}

      <div className="space-y-6">
        {topLevel.map((c) => {
          const replies = repliesOf(c.id);
          return (
            <div key={c.id} className="space-y-4">
              {renderComment(c, replies.length, false)}
              {replies.map((r) => renderComment(r, 0, true))}
            </div>
          );
        })}
      </div>
    </section>
  );
}