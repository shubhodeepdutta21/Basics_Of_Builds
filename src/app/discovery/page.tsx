"use client";

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useInventory } from '@/lib/InventoryContext';
import { MOCK_PROJECTS, MOCK_COMPONENTS } from '@/lib/mockData';
import { CheckCircle2, CircleDashed, Clock, Sparkles, Loader2, Bot, ArrowRight, Trash2, AlertTriangle, X} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import ChatBot from '../components/chatbot';
import { computeMatch } from '@/lib/matching';
import { authFetch } from '@/lib/authFetch';
import { CatalogComponent } from '@/lib/types';

export default function DiscoveryPage() {
  const { inventory, getQuantity, aiProject, setAiProject, clearAiProject } = useInventory();
  const [dbComponents, setDbComponents] = useState<CatalogComponent[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ generateError, setGenerateError ] = useState<string | null>(null);

  useEffect(() => {
    const fetchComponents = async () => {
      const { data } = await supabase.from('components').select('*');
      if (data && data.length > 0) {
        setDbComponents(data);
      }
    };
    fetchComponents();
  }, []);

  // Combine database components with static mock components
  const allComponents = useMemo(() => {
    const map = new Map<string, CatalogComponent>();
    MOCK_COMPONENTS.forEach(c => map.set(String(c.id), c));
    dbComponents.forEach(c => map.set(String(c.id), c));
    return Array.from(map.values());
  }, [dbComponents]);

  const generateMagicProject = async () => {
    if (inventory.length === 0 || isGenerating) return;
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const componentNames = inventory.map(item => {
        const comp = allComponents.find(c => String(c.id) === String(item.componentId));
        const name = item.name || comp?.name || `Component #${item.componentId}`;
        const qty = item.quantity > 1 ? `${item.quantity}x ` : '';
        return `${qty}${name}`;
      });

      const response = await authFetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentNames, inventory }),
      });

      const data= await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || `Request failed (${response.status})`);
      }
      if (!data?.project?.title) {
        throw new Error("The AI returned an unusable project. Please try again.");
      }
      
      setAiProject(data.project);
    } catch (error) {
      console.error("Error generating project:", error);
      setGenerateError(
        error instanceof TypeError
          ? "Couldn't reach the server. Check your connection and try again."
          : error instanceof Error ? error.message : "Something went wrong. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const recommendedProjects = useMemo(() => {
    const nameOf = (id: string) =>
      allComponents.find(c => String(c.id) === id)?.name ?? 'Unknown Item';

    return MOCK_PROJECTS.map(project => {
      const { matchPercentage, missingParts } = computeMatch(
        project.requirements,
        getQuantity,
        nameOf
      );
      return { ...project, matchPercentage, missingParts };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage);
  }, [getQuantity, allComponents]);

  return (
    <main className="min-h-screen flex flex-col bg-[#0d0d0d] text-[#f0ede6] font-grotesk pt-6 px-4 md:px-8 max-w-6xl mx-auto w-full pb-20">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 pb-6 border-b border-[#2a2a2a] gap-4">
        <div>
          <p className="font-mono text-xs tracking-[3px] text-[#e06b35] uppercase mb-1">Recipe Matching</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Project Discovery</h1>
          <p className="text-[#888888] text-sm mt-1">Based on your inventory, here is what you can build today.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={generateMagicProject}
            disabled={isGenerating || inventory.length === 0}
            className="px-5 py-2.5 text-sm font-bold bg-[#e8c547] hover:bg-[#c4a332] text-[#0d0d0d] rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 shadow-[0_0_15px_rgba(232,197,71,0.25)]"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isGenerating ? "Inventing..." : aiProject ? "Re-Invent Project" : "AI Auto-Invent"}
          </button>

          <Link
            href="/inventory"
            className="px-4 py-2.5 text-sm font-mono border border-[#3a3a3a] text-[#888888] hover:text-[#f0ede6] hover:bg-[#1f1f1f] rounded-lg transition-colors"
          >
            Update Inventory ({inventory.length} parts)
          </Link>
        </div>
      </div>

      {generateError && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-xl border border-[#e06b35]/40 bg-[#e06b35]/10 px-4 py-3 text-sm"
        >
          <AlertTriangle className="w-4 h-4 text-[#e06b35] mt-0.5 shrink-0" />
          <p className="flex-1 text-[#f0ede6]">{generateError}</p>
          <button
            onClick={() => setGenerateError(null)}
            aria-label="Dismiss error"
            className="text-[#888888] hover:text-[#f0ede6] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {inventory.length === 0 && (
        <div className="bg-[#161616] border border-[#e8c547]/30 rounded-xl p-8 text-center mb-8">
          <Sparkles className="w-8 h-8 text-[#e8c547] mx-auto mb-3" />
          <h2 className="text-xl font-bold text-[#f0ede6] mb-2">You haven&apos;t added any components yet!</h2>
          <p className="text-[#888888] text-sm mb-6 max-w-md mx-auto">Go tell us what hardware you have in your workshop, and we&apos;ll find matching project recipes.</p>
          <Link
            href="/inventory"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#e8c547] hover:bg-[#c4a332] text-[#0d0d0d] font-bold rounded-lg transition-colors text-sm"
          >
            Go to Inventory <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* ── PROJECTS GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">

        {/* AI Invented Project Banner (Persisted in Global State) */}
        {aiProject && (
          <div className="flex flex-col bg-[#161616] border-2 border-[#e8c547] rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(232,197,71,0.15)] md:col-span-2 lg:col-span-3 relative">
            <div className="absolute top-0 right-0 bg-[#e8c547] text-[#0d0d0d] font-mono text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-2 z-30 tracking-wider">
              <Bot className="w-3.5 h-3.5" /> AI INVENTED FOR YOU
              <button
                onClick={clearAiProject}
                title="Dismiss this AI suggestion"
                className="ml-2 text-[#0d0d0d] hover:text-rose-900 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-6 md:p-8 flex flex-col gap-6 relative z-20">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-[#e8c547]/10 text-[#e8c547] border border-[#e8c547]/30">
                    {aiProject.difficultyLevel || 'Intermediate'}
                  </span>
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono text-[#888888] bg-[#1f1f1f] border border-[#3a3a3a]">
                    <Clock className="w-3 h-3" /> {aiProject.estimatedTime || '2 Hours'}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#f0ede6] mb-3">{aiProject.title}</h2>
                <p className="text-[#888888] text-sm leading-relaxed mb-6">{aiProject.description}</p>

                <div className="bg-[#0d0d0d] rounded-xl p-5 border border-[#2a2a2a]">
                  <h3 className="font-mono text-xs font-semibold text-[#e8c547] uppercase tracking-wider mb-4">How to build it:</h3>
                  <ul className="space-y-3">
                    {aiProject.steps?.map((step: string, idx: number) => (
                      <li key={idx} className="text-sm text-[#f0ede6] flex gap-3 leading-relaxed">
                        <span className="font-mono text-[#e8c547] font-bold">{idx + 1}.</span> {step}
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="mt-4 text-xs font-mono text-[#888888] flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-[#e8c547]" />
                  Have questions? Use the <span className="font-semibold text-[#e8c547]">Project AI</span> button in the bottom-right corner.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recommended Projects List */}
        {recommendedProjects.map((project) => (
          <Link
            href={`/projects/${project.id}`}
            key={project.id}
            className="group flex flex-col bg-[#161616] border border-[#2a2a2a] rounded-2xl overflow-hidden hover:border-[#e8c547]/60 hover:shadow-[0_0_20px_rgba(232,197,71,0.1)] transition-all duration-300"
          >
            <div className="h-44 bg-[#1f1f1f] relative p-6 flex flex-col justify-end overflow-hidden border-b border-[#2a2a2a]">
              <div className="absolute inset-0 bg-linear-to-t from-[#161616] via-[#161616]/60 to-transparent z-10" />
              <div className="relative z-20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#0d0d0d] text-[#e8c547] border border-[#3a3a3a]">
                    {project.difficultyLevel}
                  </span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-[#0d0d0d] text-[#888888] border border-[#3a3a3a]">
                    <Clock className="w-3 h-3" /> {project.estimatedTime}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[#f0ede6] group-hover:text-[#e8c547] transition-colors">{project.title}</h2>
              </div>
            </div>

            <div className="p-6 flex flex-col grow">
              <p className="text-[#888888] text-sm mb-6 grow leading-relaxed">{project.description}</p>
              <div className="mt-auto">
                <div className="flex items-end justify-between mb-2 font-mono text-xs">
                  <span className="text-[#888888]">Match Readiness</span>
                  <span className={`font-bold text-sm ${project.matchPercentage === 100 ? 'text-[#5dbf87]' : 'text-[#e8c547]'}`}>
                    {project.matchPercentage}%
                  </span>
                </div>
                <div className="w-full bg-[#1f1f1f] rounded-full h-2 mb-4 overflow-hidden border border-[#2a2a2a]">
                  <div
                    className={`h-2 rounded-full transition-all duration-1000 ${
                      project.matchPercentage === 100 ? 'bg-[#5dbf87]' : 'bg-[#e8c547]'
                    }`}
                    style={{ width: `${project.matchPercentage}%` }}
                  />
                </div>

                {project.matchPercentage === 100 ? (
                  <div className="flex items-center gap-2 text-xs font-mono text-[#5dbf87] bg-[#4a9b6f]/10 p-3 rounded-lg border border-[#4a9b6f]/20">
                    <CheckCircle2 className="w-4 h-4" /> Ready to build! All parts owned.
                  </div>
                ) : (
                  <div className="bg-[#0d0d0d] p-3 rounded-lg border border-[#2a2a2a]">
                    <p className="text-xs font-mono text-[#888888] mb-2 flex items-center gap-1">
                      <CircleDashed className="w-3 h-3" /> Missing {project.missingParts.length} parts required:
                    </p>
                    <ul className="space-y-1">
                      {project.missingParts.slice(0, 3).map((part, i) => (
                        <li key={i} className="text-xs font-mono text-[#e06b35] flex justify-between">
                          <span>{part.name}</span>
                          <span>{part.has} / {part.needed}</span>
                        </li>
                      ))}
                      {project.missingParts.length > 3 && (
                        <li className="text-xs font-mono text-[#888888] pt-1">+ {project.missingParts.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Floating ChatBot Assistant */}
      <ChatBot aiProject={aiProject} visible={true} />

    </main>
  );
}