"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

export function useAuthUser() {
    const [state, setState]= useState<{ready: boolean; user: User | null}>({ready: false, user: null});

    useEffect(() => {
        const {data}= supabase.auth.onAuthStateChange((_event, session) => {
            setState({ready: true, user: session?.user ?? null});
        });
        return () => data.subscription.unsubscribe();
    }, []);

    return state;
}