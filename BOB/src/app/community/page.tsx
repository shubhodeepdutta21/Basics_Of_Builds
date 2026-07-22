"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Cpu, MessageSquare, Heart, Share2, Sparkles, Wrench, Lock, MapPin } from 'lucide-react';

// --- DUMMY DATA FOR VISUALIZATION ---
const MOCK_POSTS = [
    {
        id: 1,
        type: 'build',
        user: 'circuitwizard',
        time: '2 hours ago',
        title: 'Raspberry Pi-Powered Home Dashboard',
        content: 'Finally finished my home automation dashboard! Uses a Pi 4 with a 7" touchscreen to control lights, show weather, and monitor energy usage.',
        likes: 42,
        comments: 8,
        location: 'Berlin, DE',
    },
    {
        id: 2,
        type: 'build',
        user: 'neonforge',
        time: '5 hours ago',
        title: 'Custom Mechanical Keyboard with RP2040',
        content: 'Built a 65% keyboard from scratch using a Pro Micro RP2040. Hand-wired, running QMK firmware. Took 3 weekends but totally worth it.',
        likes: 87,
        comments: 15,
        location: null,
    },
    {
        id: 3,
        type: 'part',
        user: 'salvageking',
        time: '1 day ago',
        title: '2x Arduino Mega 2560 — Free to a good home',
        content: 'Pulled these from an old project. Fully tested and working. Just cover shipping. First come, first served!',
        likes: 19,
        comments: 6,
        location: 'Austin, TX',
    },
    {
        id: 4,
        type: 'part',
        user: 'voltdrop',
        time: '3 days ago',
        title: 'Selling: Assorted ESP32 Dev Boards (x5)',
        content: 'Bought too many for a project that got cancelled. All brand new, never used. Looking to swap for a Teensy 4.1 or sell cheap.',
        likes: 11,
        comments: 3,
        location: 'Toronto, CA',
    },
];

export default function CommunityPage() {
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'builds' | 'parts'>('builds');

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setIsLoading(false);
        };
        checkAuth();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0A0012]">
                <div className="animate-spin text-indigo-500"><Cpu className="w-12 h-12" /></div>
            </div>
        );
    }

    if (!user) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0012] px-4 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-fuchsia-500/10 blur-[150px] rounded-full pointer-events-none" />
                <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-10 max-w-md w-full text-center relative z-10 shadow-2xl">
                    <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/30">
                        <Lock className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-4">Members Only</h1>
                    <p className="text-slate-400 mb-8">
                        You need to be logged in to view community builds, discuss projects, and trade spare parts with other makers.
                    </p>
                    <Link
                        href="/login"
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-medium rounded-xl hover:from-indigo-500 hover:to-fuchsia-500 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                    >
                        Sign In to Join the Community
                    </Link>
                    <div className="mt-4">
                        <Link href="/" className="text-sm text-slate-500 hover:text-white transition-colors">
                            Return to Home
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    const filteredPosts = MOCK_POSTS.filter(
        post => post.type === (activeTab === 'builds' ? 'build' : 'part')
    );

    return (
        <main className="min-h-screen flex flex-col pt-6 px-4 md:px-8 max-w-4xl mx-auto w-full pb-20">

            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-4 border-b border-white/10 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Community Hub</h1>
                    <p className="text-slate-400">Share your creations and swap hardware with peers.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/discovery" className="px-4 py-2 text-sm font-medium border border-white/20 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        Back to Projects
                    </Link>
                    <button className="px-4 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Create Post
                    </button>
                </div>
            </div>

            {/* Custom Tabs */}
            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => setActiveTab('builds')}
                    className={`px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'builds' ? 'bg-white/10 text-white border border-white/20' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Project Showcase
                </button>
                <button
                    onClick={() => setActiveTab('parts')}
                    className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${activeTab === 'parts' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Wrench className="w-4 h-4" /> Parts Exchange
                </button>
            </div>

            {/* Community Feed */}
            <div className="space-y-6">
                {filteredPosts.map(post => (
                    <div key={post.id} className="bg-slate-900 border border-white/10 rounded-2xl p-6 hover:border-indigo-500/30 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-tr from-fuchsia-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                                    {post.user.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-white font-medium">@{post.user}</h3>
                                    <p className="text-xs text-slate-500">{post.time}</p>
                                </div>
                            </div>
                            {post.location && (
                                <span className="flex items-center gap-1 text-xs font-medium text-fuchsia-400 bg-fuchsia-500/10 px-3 py-1 rounded-full border border-fuchsia-500/20">
                                    <MapPin className="w-3 h-3" /> {post.location}
                                </span>
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">{post.title}</h2>
                        <p className="text-slate-300 mb-6">{post.content}</p>
                        <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                            <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-rose-400 transition-colors">
                                <Heart className="w-4 h-4" /> {post.likes}
                            </button>
                            <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-indigo-400 transition-colors">
                                <MessageSquare className="w-4 h-4" /> {post.comments} Comments
                            </button>
                            <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors ml-auto">
                                <Share2 className="w-4 h-4" /> Share
                            </button>
                        </div>
                    </div>
                ))}

                {/* ✅ Fixed: single clean filter, no duplicate .length === 0 */}
                {filteredPosts.length === 0 && (
                    <div className="text-center py-20 text-slate-500">
                        No posts found in this category yet. Be the first!
                    </div>
                )}
            </div>

        </main>
    );
}