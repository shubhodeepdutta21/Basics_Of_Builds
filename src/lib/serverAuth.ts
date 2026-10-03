import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

type AuthResult= | {ok: true; user: User} | {ok: false; response: NextResponse};

export async function requireUser(request: Request): Promise<AuthResult> {
    const header= request.headers.get("authorization") ?? "";
    const token= header.startsWith("Bearer ") ? header.slice(7).trim() : "";

    if (!token){
        return {
            ok: false,
            response: NextResponse.json({error: "Please sign in to use AI features."}, {status: 401}),
        };
    }

    const {data, error}= await supabase.auth.getUser(token);

    if (error || !data.user) {
        return {
            ok: false,
            response: NextResponse.json({error: "Your session has expired. Please sign in again."}, {status: 401})
        };
    }

    return {ok: true, user: data.user};
}