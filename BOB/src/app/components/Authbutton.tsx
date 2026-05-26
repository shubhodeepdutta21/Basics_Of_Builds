"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function AuthButton() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
        };
        getSession();

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => authListener.subscription.unsubscribe();
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    if (user) {
        return (
            <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-white rounded-full transition-all border border-rose-500/20"
            >
                Sign Out
            </button>
        );
    }

    return (
        <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10"
        >
            Sign In
        </Link>
    );
}