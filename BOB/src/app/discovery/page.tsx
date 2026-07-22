"use client";

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useInventory } from '@/lib/InventoryContext';
import { MOCK_PROJECTS, MOCK_COMPONENTS } from '@/lib/mockData';
import { CheckCircle2, CircleDashed, Clock, Sparkles, Loader2, Bot } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import ChatBot from '../components/chatbot';

export default function DiscoveryPage() {
  const { inventory, getQuantity } = useInventory();
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

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const [aiProject, setAiProject] = useState<any>(null);

  const generateMagicProject = async () => {
    setIsGenerating(true);
    try {
      const componentNames = inventory.map(item => {
        const comp = MOCK_COMPONENTS.find(c => c.id === item.componentId);
        return comp?.name || "Unknown Component";
      });

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentNames }),
      });

      const data = await response.json();
      if (data.project) {
        setAiProject(data.project);
      }
    } catch (error) {
      console.error("Error generating project:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const recommendedProjects = useMemo(() => {
    return MOCK_PROJECTS.map(project => {
      let matchedItems = 0;
      let totalRequired = 0;
      const missingParts: { name: string, needed: number, has: number }[] = [];

      project.requirements.forEach(req => {
        if (!req.isOptional) {
          totalRequired += 1;
          const userQty = getQuantity(req.componentId);
          if (userQty >= req.requiredQuantity) {
            matchedItems += 1;
          } else {
            const compDef = MOCK_COMPONENTS.find(c => c.id === req.componentId);
            missingParts.push({
              name: compDef?.name || 'Unknown',
              needed: req.requiredQuantity,
              has: userQty
            });
          }
        }
      });

      const matchPercentage = totalRequired === 0 ? 100 : Math.round((matchedItems / totalRequired) * 100);

      return {
        ...project,
        matchPercentage,
        missingParts
      };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage);
  }, [getQuantity]);

  return (
    <main className="min-h-screen flex flex-col pt-6 px-4 md:px-8 max-w-6xl mx-auto w-full">

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-4 border-b border-white/10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Project Discovery</h1>
          <p className="text-slate-400">Based on your inventory, here is what you can build today.</p>
          {user && (
            <p className="text-sm text-indigo-400 mt-2 font-medium">
              Logged in as: {user.email}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={generateMagicProject}
            disabled={isGenerating || inventory.length === 0}
            className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white rounded-lg hover:from-fuchsia-500 hover:to-indigo-500 transition-all flex items-center gap-2 disabled:opacity-50 shadow-[0_0_15px_rgba(192,38,211,0.4)] border border-fuchsia-400/30"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isGenerating ? "Inventing..." : "AI Auto-Invent"}
          </button>

          <Link href="/inventory" className="px-4 py-2 text-sm font-medium border border-white/20 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            Update Inventory
          </Link>

          {user ? (
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium border border-rose-500/30 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium border border-indigo-500/30 text-indigo-400 hover:text-white hover:bg-indigo-500/20 rounded-lg transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {inventory.length === 0 && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6 text-center mb-8">
          <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
          <h2 className="text-xl font-medium text-white mb-2">You haven&apos;t added any components yet!</h2>
          <p className="text-slate-400 mb-4">Go tell us what hardware you have, and we&apos;ll find matching projects.</p>
          <Link href="/inventory" className="inline-block px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors">
            Go to Inventory
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">

        {aiProject && (
          <div className="group flex flex-col bg-slate-900 border-2 border-fuchsia-500/50 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(192,38,211,0.15)] md:col-span-2 lg:col-span-3 relative">
            <div className="absolute top-0 right-0 bg-fuchsia-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1 z-30">
              <Bot className="w-3 h-3" /> AI INVENTED FOR YOU
            </div>
            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start relative z-20">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                    {aiProject.difficultyLevel}
                  </span>
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-white/5 text-slate-300 border border-white/10">
                    <Clock className="w-3 h-3" /> {aiProject.estimatedTime}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">{aiProject.title}</h2>
                <p className="text-slate-300 mb-6">{aiProject.description}</p>

                <div className="bg-black/50 rounded-xl p-4 border border-white/5">
                  <h3 className="text-sm font-semibold text-fuchsia-400 mb-3 uppercase tracking-wider">How to build it:</h3>
                  <ul className="space-y-2">
                    {aiProject.steps?.map((step: string, idx: number) => (
                      <li key={idx} className="text-sm text-slate-400 flex gap-3">
                        <span className="text-fuchsia-500 font-bold">{idx + 1}.</span> {step}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* ── NEW: "Chat about this project" hint ── */}
                <p className="mt-4 text-xs text-fuchsia-400/60 flex items-center gap-1.5">
                  <Bot className="w-3 h-3" />
                  Have questions? Use the <span className="font-semibold text-fuchsia-400">Project AI</span> button in the bottom-right corner.
                </p>
              </div>
            </div>
          </div>
        )}

        {recommendedProjects.map(project => (
          <Link
            href={`/projects/${project.id}`}
            key={project.id}
            className="group flex flex-col bg-slate-900 border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] transition-all duration-300"
          >
            <div className="h-48 bg-slate-800 relative p-6 flex flex-col justify-end overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent z-10" />
              <div className="absolute inset-0 opacity-20 group-hover:scale-105 group-hover:opacity-30 transition-all duration-500 bg-gradient-to-tr from-indigo-500 to-fuchsia-600" />
              <div className="relative z-20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white/10 text-white backdrop-blur-md border border-white/10">
                    {project.difficultyLevel}
                  </span>
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-white/10 text-slate-300 backdrop-blur-md border border-white/10">
                    <Clock className="w-3 h-3" /> {project.estimatedTime}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white group-hover:text-indigo-300 transition-colors">{project.title}</h2>
              </div>
            </div>

            <div className="p-6 flex flex-col flex-grow">
              <p className="text-slate-400 text-sm mb-6 flex-grow">{project.description}</p>
              <div className="mt-auto">
                <div className="flex items-end justify-between mb-2">
                  <span className="text-sm font-medium text-slate-300">Match Readiness</span>
                  <span className={`text-lg font-bold ${project.matchPercentage === 100 ? 'text-green-400' : 'text-indigo-400'}`}>
                    {project.matchPercentage}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 mb-4 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-1000 ${project.matchPercentage === 100 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-indigo-500'}`}
                    style={{ width: `${project.matchPercentage}%` }}
                  />
                </div>

                {project.matchPercentage === 100 ? (
                  <div className="flex items-center gap-2 text-sm text-green-400 font-medium bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                    <CheckCircle2 className="w-5 h-5" /> You have all required parts!
                  </div>
                ) : (
                  <div className="bg-slate-800/50 p-3 rounded-lg border border-white/5">
                    <p className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1">
                      <CircleDashed className="w-3 h-3" /> Missing {project.missingParts.length} parts required:
                    </p>
                    <ul className="space-y-1">
                      {project.missingParts.slice(0, 3).map((part, i) => (
                        <li key={i} className="text-xs text-rose-400/90 flex justify-between">
                          <span>{part.name}</span>
                          <span>{part.has} / {part.needed}</span>
                        </li>
                      ))}
                      {project.missingParts.length > 3 && (
                        <li className="text-xs text-slate-500 pt-1">+ {project.missingParts.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── CHATBOT (fixed bottom-right, only visible after AI Auto-Invent) ── */}
      <ChatBot aiProject={aiProject} visible={!!aiProject} />

    </main>
  );
}