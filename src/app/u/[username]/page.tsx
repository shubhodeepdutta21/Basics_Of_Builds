"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { fetchProfileByUsername, type Profile } from "@/lib/profile";

type Result = { for: string; profile: Profile | null; error: string | null };

export default function PublicProfilePage() {
  const params = useParams();
  const raw = params.username;
  const username = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";

  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    fetchProfileByUsername(username)
      .then((profile) => {
        if (!cancelled) setResult({ for: username, profile, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setResult({
            for: username,
            profile: null,
            error: err instanceof Error ? err.message : "Couldn't load this profile.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  // Derived: if the result belongs to a different username, we're still loading
  const loading = !result || result.for !== username;

  if (loading) {
    return (
      <main className="min-h-[60vh] flex flex-col items-center justify-center text-[#888888]">
        <Loader2 className="w-6 h-6 text-[#e8c547] animate-spin mb-4" />
        <p className="font-mono text-sm">Loading profile…</p>
      </main>
    );
  }

  if (result.error) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4 text-center text-[#e06b35] font-mono text-sm">
        {result.error}
      </main>
    );
  }

  if (!result.profile) {
    return (
      <main className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center text-[#f0ede6]">
        <h1 className="text-2xl font-bold mb-2">No maker with that name</h1>
        <p className="text-sm text-[#888888]">The username may have changed or never existed.</p>
      </main>
    );
  }

  const { profile } = result;
  const joined = new Date(profile.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long" });

  return (
    <main className="min-h-[calc(100vh-60px)] bg-[#0d0d0d] text-[#f0ede6] px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-[#1f1f1f] border border-[#3a3a3a] flex items-center justify-center font-mono text-xl text-[#e8c547] font-bold">
            {profile.username?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">@{profile.username}</h1>
            <p className="font-mono text-xs text-[#888888] mt-1">Member since {joined}</p>
          </div>
        </div>
        {profile.bio && <p className="text-[#f0ede6] leading-relaxed">{profile.bio}</p>}
      </div>
    </main>
  );
}