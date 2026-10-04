"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { LogOut } from 'lucide-react';
import { User } from '@supabase/supabase-js';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Inventory', href: '/inventory' },
    { label: 'Discover', href: '/discovery' },
    { label: 'Community', href: '/community' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-15 bg-[#0d0d0d]/90 backdrop-blur-md border-b border-[#2a2a2a] flex items-center justify-between px-6 transition-colors">
      {/* Logo */}
      <Link href="/" className="flex flex-col group">
        <span className="font-mono text-xl font-bold tracking-widest text-[#e8c547] group-hover:text-[#c4a332] transition-colors leading-none">
          BOB
        </span>
        <span className="font-mono text-[10px] text-[#888888] tracking-wider mt-0.5">
          BASICS OF BUILDS
        </span>
      </Link>

      {/* Navigation Links */}
      <div className="flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-md text-sm transition-all tracking-wide ${
                isActive
                  ? 'bg-[#1f1f1f] text-[#f0ede6] font-medium'
                  : 'text-[#888888] hover:text-[#f0ede6] hover:bg-[#161616]'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Auth Action */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            <Link
              href="/account"
              className="hidden sm:inline-block font-mono text-xs text-[#e8c547] bg-[#161616] px-2.5 py-1 rounded border border-[#2a2a2a] hover:border-[#e8c547] transition-colors truncate max-w-40"
            >
              {user.email}
            </Link>
            <button
              onClick={() => {if (window.confirm('Do you want to SignOut?')) handleSignOut();}}
              className="px-3 py-1.5 text-xs font-mono border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 rounded-md transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="px-4 py-1.5 text-sm font-semibold bg-[#e8c547] hover:bg-[#c4a332] text-[#0d0d0d] rounded-md transition-all shadow-[0_0_12px_rgba(232,197,71,0.2)]"
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
