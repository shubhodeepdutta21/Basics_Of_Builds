"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Cpu, Heart, MessageSquare, Share2, Lock } from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface Post {
  id: number;
  initials: string;
  color: string;
  author: string;
  time: string;
  category: string;
  title: string;
  body: string;
  parts: string[];
  likes: number;
  comments: number;
  location?: string | null;
}

const INITIAL_POSTS: Post[] = [
  {
    id: 1,
    initials: 'MK',
    color: '#e06b35',
    author: 'MakerKwame',
    time: '2h ago',
    category: 'Show & Tell',
    title: 'Built a CNC plotter from two dead DVD drives + Arduino!',
    body: 'Stripped the stepper motors from two old DVD burners, recycled some aluminum profiles from a broken shelf, wired it up with GRBL and a Uno I had sitting around. Total parts cost: $0.',
    parts: ['2× Stepper Motor', 'Arduino Uno', 'GRBL Shield', 'Aluminum Profile'],
    likes: 47,
    comments: 12,
    location: 'Berlin, DE',
  },
  {
    id: 2,
    initials: 'SI',
    color: '#5dbf87',
    author: 'Siya_Inv',
    time: '5h ago',
    category: 'Help Needed',
    title: 'Need advice: converting old power supply → bench supply',
    body: 'I have a dead ATX PSU from a 2012 PC. BOB matched it with a bench power supply build but I\'m not sure about the binding posts wiring. Anyone done this?',
    parts: ['ATX PSU', 'Binding Posts', 'Resistor 10Ω 10W', 'LED Indicators'],
    likes: 14,
    comments: 8,
    location: null,
  },
  {
    id: 3,
    initials: 'TP',
    color: '#e8c547',
    author: 'TinkerPriya',
    time: '1d ago',
    category: 'Guides',
    title: 'Step-by-step: Soil moisture sensor from scrap — full guide',
    body: 'Used a couple of nails, an Arduino, and a voltage divider from salvaged resistors. Now my plants water themselves. Guide covers calibration and the cheap capacitive trick.',
    parts: ['Arduino Nano', '2× Galvanized Nails', '10kΩ Resistor', 'Relay Module'],
    likes: 82,
    comments: 31,
    location: 'Bangalore, IN',
  },
];

export default function CommunityPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All Posts');
  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const [postsList, setPostsList] = useState<Post[]>(INITIAL_POSTS);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostText, setNewPostText] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const toggleLike = (id: number) => {
    setLikedPosts(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const userEmail = user?.email || 'Maker';
    const authorName = user?.user_metadata?.full_name || user?.user_metadata?.username || userEmail.split('@')[0];
    const initials = authorName.slice(0, 2).toUpperCase();

    const newPost: Post = {
      id: Date.now(),
      initials: initials,
      color: '#e8c547',
      author: `@${authorName}`,
      time: 'Just now',
      category: activeCategory === 'All Posts' ? 'Show & Tell' : activeCategory,
      title: newPostTitle.trim() || 'New Community Project Build',
      body: newPostText.trim(),
      parts: ['Custom Parts'],
      likes: 1,
      comments: 0,
    };

    setPostsList(prev => [newPost, ...prev]);
    setNewPostTitle('');
    setNewPostText('');
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-60px)] flex items-center justify-center bg-[#0d0d0d] text-[#e8c547]">
        <div className="animate-spin"><Cpu className="w-10 h-10" /></div>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-[calc(100vh-60px)] flex flex-col items-center justify-center bg-[#0d0d0d] px-4 font-grotesk">
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-[#1f1f1f] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#3a3a3a]">
            <Lock className="w-8 h-8 text-[#e8c547]" />
          </div>
          <h1 className="text-2xl font-bold text-[#f0ede6] mb-3">Members Only</h1>
          <p className="text-[#888888] text-sm mb-8 leading-relaxed">
            You need to be signed in to view community recipes, share builds, and swap hardware components with other makers.
          </p>
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#e8c547] hover:bg-[#c4a332] text-[#0d0d0d] font-bold rounded-lg transition-all text-sm shadow-[0_0_15px_rgba(232,197,71,0.2)]"
          >
            Sign In to Join Community
          </Link>
        </div>
      </main>
    );
  }

  const sidebarItems = ['All Posts', 'Show & Tell', 'Help Needed', 'Part Swap', 'Guides'];

  const filteredPosts = postsList.filter(post =>
    activeCategory === 'All Posts' || post.category === activeCategory
  );

  const displayUser = user?.email || 'Maker';
  const displayAuthorName = user?.user_metadata?.full_name || user?.user_metadata?.username || displayUser.split('@')[0];
  const userInitials = displayAuthorName.slice(0, 2).toUpperCase();

  return (
    <main className="min-h-screen bg-[#0d0d0d] text-[#f0ede6] font-grotesk">
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[260px_1fr] min-h-[calc(100vh-60px)]">
        
        {/* ── SIDEBAR ── */}
        <aside className="bg-[#161616] border-r border-[#2a2a2a] p-6 hidden lg:block">
          <div className="mb-8">
            <p className="font-mono text-[10px] tracking-[2px] text-[#888888] uppercase mb-4">Browse</p>
            <div className="space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item}
                  onClick={() => setActiveCategory(item)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    activeCategory === item
                      ? 'bg-[#1f1f1f] text-[#f0ede6] font-semibold'
                      : 'text-[#888888] hover:text-[#f0ede6] hover:bg-[#1f1f1f]'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${activeCategory === item ? 'bg-[#e8c547]' : 'bg-[#3a3a3a]'}`} />
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <p className="font-mono text-[10px] tracking-[2px] text-[#888888] uppercase mb-4">Top Parts</p>
            <div className="space-y-2 text-xs font-mono text-[#888888]">
              <div className="flex justify-between py-1 border-b border-[#2a2a2a]">
                <span>Arduino Uno</span> <span className="text-[#e8c547]">×248</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#2a2a2a]">
                <span>ESP32 Wi-Fi</span> <span className="text-[#e8c547]">×189</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#2a2a2a]">
                <span>Servo Motor</span> <span className="text-[#e8c547]">×156</span>
              </div>
              <div className="flex justify-between py-1">
                <span>DC Gear Motor</span> <span className="text-[#e8c547]">×140</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT & FEED ── */}
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1 w-full">
              
              {/* POST COMPOSER */}
              <form onSubmit={handleCreatePost} className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5 mb-8">
                <div className="flex gap-4 items-start">
                  <div className="w-9 h-9 rounded-full bg-[#1f1f1f] border border-[#3a3a3a] flex items-center justify-center font-mono text-xs text-[#e8c547] font-bold">
                    {userInitials}
                  </div>
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      placeholder="Title of your build or question..."
                      className="w-full bg-[#0d0d0d] border border-[#3a3a3a] text-[#f0ede6] text-sm px-3.5 py-2 rounded-lg outline-none focus:border-[#e8c547]"
                    />
                    <textarea
                      value={newPostText}
                      onChange={(e) => setNewPostText(e.target.value)}
                      placeholder="Share a build recipe, ask for troubleshooting help, or swap a part..."
                      rows={3}
                      required
                      className="w-full bg-[#0d0d0d] border border-[#3a3a3a] text-[#f0ede6] text-sm p-3 rounded-lg outline-none focus:border-[#e8c547] resize-none"
                    />
                    <div className="flex justify-between items-center pt-1">
                      <span className="font-mono text-xs text-[#888888]">Posting as @{displayAuthorName}</span>
                      <button
                        type="submit"
                        className="px-5 py-2 text-xs font-mono font-bold bg-[#e8c547] hover:bg-[#c4a332] text-[#0d0d0d] rounded-lg transition-colors"
                      >
                        Share Build
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* POSTS LIST */}
              <div className="space-y-6">
                {filteredPosts.map((post) => {
                  const isLiked = likedPosts.includes(post.id);
                  return (
                    <div key={post.id} className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-6 hover:border-[#3a3a3a] transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full bg-[#1f1f1f] border border-[#3a3a3a] flex items-center justify-center font-mono text-xs font-bold"
                            style={{ color: post.color }}
                          >
                            {post.initials}
                          </div>
                          <div>
                            <div className="text-sm font-semibold">{post.author}</div>
                            <div className="text-xs font-mono text-[#888888]">{post.time}</div>
                          </div>
                        </div>

                        <span className="font-mono text-[10px] px-2.5 py-1 rounded bg-[#e8c547]/10 text-[#e8c547] border border-[#e8c547]/20">
                          {post.category}
                        </span>
                      </div>

                      <h2 className="text-lg font-bold text-[#f0ede6] mb-2">{post.title}</h2>
                      <p className="text-sm text-[#888888] leading-relaxed mb-4">{post.body}</p>

                      <div className="flex flex-wrap gap-1.5 mb-6">
                        {post.parts.map((part) => (
                          <span key={part} className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#1f1f1f] border border-[#3a3a3a] text-[#888888]">
                            {part}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-6 pt-4 border-t border-[#2a2a2a] text-xs font-mono">
                        <button
                          onClick={() => toggleLike(post.id)}
                          className={`flex items-center gap-1.5 transition-colors ${isLiked ? 'text-[#e06b35]' : 'text-[#888888] hover:text-[#f0ede6]'}`}
                        >
                          <Heart className="w-3.5 h-3.5" fill={isLiked ? '#e06b35' : 'none'} />
                          {post.likes + (isLiked ? 1 : 0)}
                        </button>
                        <button className="flex items-center gap-1.5 text-[#888888] hover:text-[#f0ede6] transition-colors">
                          <MessageSquare className="w-3.5 h-3.5" /> {post.comments} Comments
                        </button>
                        <button className="flex items-center gap-1.5 text-[#888888] hover:text-[#f0ede6] transition-colors ml-auto">
                          <Share2 className="w-3.5 h-3.5" /> Share
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* ── TRENDING RIGHT PANEL ── */}
            <div className="w-full md:w-64 space-y-6 hidden xl:block">
              <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
                <p className="font-mono text-[10px] tracking-[2px] text-[#888888] uppercase mb-4">Trending Builds</p>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-[#2a2a2a]">
                    <span>🤖 Arm Robot</span> <span className="font-mono text-[#888888]">48 builds</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-[#2a2a2a]">
                    <span>🌱 Plant Monitor</span> <span className="font-mono text-[#888888]">34 builds</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-[#2a2a2a]">
                    <span>📡 Weather Stn.</span> <span className="font-mono text-[#888888]">29 builds</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>🔊 Mini Synth</span> <span className="font-mono text-[#888888]">22 builds</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
                <p className="font-mono text-[10px] tracking-[2px] text-[#888888] uppercase mb-4">Most Wanted Parts</p>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-[#2a2a2a]">
                    <span>L298N Driver</span> <span className="font-mono text-[#e06b35]">12 req</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-[#2a2a2a]">
                    <span>ESP8266</span> <span className="font-mono text-[#e06b35]">9 req</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>OLED 0.96&quot;</span> <span className="font-mono text-[#e06b35]">7 req</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}