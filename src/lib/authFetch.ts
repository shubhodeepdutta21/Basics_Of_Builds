import { supabase } from "./supabaseClient";

export async function authFetch(input: string, init: RequestInit= {}): Promise<Response> {
    const {data: {session}}= await supabase.auth.getSession();

    if (!session?.access_token) {
        throw new Error("Please sign in to use AI features.");
    }

    const headers= new Headers(init.headers);
    headers.set("Authorization", `Bearer ${session.access_token}`);

    return fetch(input, {...init, headers});
}