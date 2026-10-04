"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Lock } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import { fetchProfileById, saveMyProfile, validateUsername, MAX_BIO } from "@/lib/profile";

export default function AccountPage() {
  const { ready, user } = useAuthUser();
  const [loaded, setLoaded] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [savedName, setSavedName] = useState("");
  const [saving, setSaving] = useState(false);

  const userId = user?.id;
  // The sign-up form's username is stored in auth metadata; offer it as a starting suggestion
  const suggested =
    typeof user?.user_metadata?.username === "string" ? (user.user_metadata.username as string) : "";

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchProfileById(userId)
      .then((profile) => {
        if (cancelled) return;
        setUsername(profile?.username ?? suggested);
        setBio(profile?.bio ?? "");
        setSavedName(profile?.username ?? "");
        setLoaded(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Couldn't load your profile.");
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, suggested]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || saving) return;

    const name = username.trim();
    const problem = validateUsername(name);
    if (problem) {
      setError(problem);
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    try {
      await saveMyProfile(userId, name, bio);
      setSavedName(name);
      setNotice("Profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!ready || (user && !loaded)) {
    return (
      <main className="min-h-[60vh] flex flex-col items-center justify-center text-[#888888]">
        <Loader2 className="w-6 h-6 text-[#e8c547] animate-spin mb-4" />
        <p className="font-mono text-sm">Loading…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 text-[#f0ede6]">
        <Lock className="w-6 h-6 text-[#e8c547] mb-4" />
        <h1 className="text-2xl font-bold mb-2">Sign in to edit your profile</h1>
        <Link
          href="/login"
          className="mt-4 px-5 py-2 bg-[#e8c547] hover:bg-[#c4a332] text-[#0d0d0d] font-bold rounded-lg text-sm transition-colors"
        >
          Sign in
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-60px)] bg-[#0d0d0d] text-[#f0ede6] px-4 py-10">
      <div className="max-w-md mx-auto">
        <p className="font-mono text-xs tracking-[3px] text-[#e06b35] uppercase mb-2">Account</p>
        <h1 className="text-3xl font-bold mb-2">Your profile</h1>
        <p className="text-sm text-[#888888] mb-8">
          Your username is public: it appears on your posts, comments and the leaderboard. Your email is never shown.
        </p>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label htmlFor="username" className="block font-mono text-xs text-[#888888] mb-2">
              Username
            </label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              autoComplete="off"
              className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#e8c547]"
            />
            <p className="font-mono text-[11px] text-[#888888] mt-1">3–20 letters, numbers or underscores.</p>
          </div>

          <div>
            <label htmlFor="bio" className="block font-mono text-xs text-[#888888] mb-2">
              Bio (optional)
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={MAX_BIO}
              rows={3}
              className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#e8c547] resize-none"
            />
            <p className="font-mono text-[11px] text-[#888888] mt-1 text-right">
              {bio.length}/{MAX_BIO}
            </p>
          </div>

          {error && (
            <div role="alert" className="text-xs rounded-lg px-4 py-3 border border-[#e06b35]/40 bg-[#e06b35]/10 text-[#e06b35]">
              {error}
            </div>
          )}
          {notice && (
            <div role="status" className="text-xs rounded-lg px-4 py-3 border border-[#5dbf87]/40 bg-[#5dbf87]/10 text-[#5dbf87]">
              {notice}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-[#e8c547] hover:bg-[#c4a332] text-[#0d0d0d] font-bold rounded-lg transition-all text-sm disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save profile"}
          </button>
        </form>

        {savedName && (
          <p className="mt-6 text-sm text-[#888888]">
            Your public profile:{" "}
            <Link href={`/u/${savedName}`} className="text-[#e8c547] hover:underline">
              /u/{savedName}
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}