import { supabase } from "@/lib/supabaseClient";

export type Profile = {
  id: string;
  username: string | null;
  bio: string | null;
  createdAt: string;
};

type ProfileRow = {
  id: string;
  username: string | null;
  bio: string | null;
  created_at: string;
};

const COLUMNS = "id, username, bio, created_at";

const toProfile = (r: ProfileRow): Profile => ({
  id: r.id,
  username: r.username,
  bio: r.bio,
  createdAt: r.created_at,
});

// Friendly client-side check. The database enforces the same rules (keep the two in sync).
const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
const RESERVED = new Set([
  "admin", "administrator", "moderator", "mod", "bob", "support", "staff", "system", "root", "null", "undefined",
]);
export const MAX_BIO = 200;

export function validateUsername(name: string): string | null {
  if (!USERNAME_RE.test(name)) return "Use 3–20 letters, numbers or underscores.";
  if (RESERVED.has(name.toLowerCase())) return "That username is reserved.";
  return null;
}

export async function fetchProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select(COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toProfile(data as unknown as ProfileRow) : null;
}

export async function fetchProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(COLUMNS)
    .eq("username_lower", username.toLowerCase())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toProfile(data as unknown as ProfileRow) : null;
}

export async function saveMyProfile(userId: string, username: string, bio: string): Promise<void> {
    const values= {username, bio: bio.trim() || null};
    const updated= await supabase.from("profiles").update(values).eq("id", userId).select("id");
    let error= updated.error;

    if (!error && (updated.data ?? []).length  === 0) {
        error= (await supabase.from("profiles").insert({id: userId, ...values})).error;
    }

    if (error) {
        if (error.code === "23505") throw new Error("That username is already taken.");
        if (error.code === "23514") throw new Error("That username isn't allowed. Try a different one.");
        throw new Error(error.message);
    }
};